import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'
import type { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import {
	fetchActivityFormSelectOptionCombinations,
	fetchActivityOptions,
	fetchSystemActivityRoleId,
	type ActivityOptionKind,
} from '@/core/activity/api/activityOptionsApi.ts'

export type { ActivityOptionKind }

/** One cache slot: the plain lists, the combination matrix per source, and each system role's id. */
export type ActivityOptionsCacheKey =
	| ActivityOptionKind
	| `combinations:${ActivityOptionsSource}`
	| `systemRole:${SystemActivityRole}`

/**
 * The kinds the combination matrix is derived from. Changing one of these stales it; the two
 * `todoList` lookups do not appear in the matrix at all, so they leave it alone.
 */
const MATRIX_KINDS: readonly ActivityOptionKind[] = ['role', 'category', 'activity']

function combinationsKey(source: ActivityOptionsSource): ActivityOptionsCacheKey {
	return `combinations:${source}`
}

function systemRoleKey(role: SystemActivityRole): ActivityOptionsCacheKey {
	return `systemRole:${role}`
}

/**
 * Shared cache for the role/category/activity select options and the per-source combination matrix.
 *
 * Before this store every component that needed a picker fetched its own copy on every mount, so
 * opening a to-do item dialog cost a categories fetch *and* a full combination-matrix fetch each
 * time. The matrix is the expensive one — O(activities) rows with four nested option objects — and it
 * describes data that changes maybe weekly.
 *
 * Two things make the cache safe rather than merely fast:
 *
 * - **One in-flight request per key.** Several consumers mount in the same tick (the dialog case
 *   mounts a category field and a selection form together); they all await the same promise.
 * - **Invalidation lives in `api/`, not in components.** Every mutation goes through the three crud
 *   composables, which wrap their commands in `invalidatingActivityOptions`. There are seven mutation
 *   sites today and adding an eighth requires no cache knowledge at the call site.
 *
 * Not persisted. These are server-owned lookup values, the matrix is large, and a stale sessionStorage
 * copy surviving a reload is worse than the refetch it saves.
 */
export const useActivityOptionsStore = defineStore(
	'activityOptions',
	() => {
		const roleOptions = ref<SelectOption[]>([])
		const categoryOptions = ref<SelectOption[]>([])
		const activityOptions = ref<SelectOption[]>([])
		// Owned by `todoList`, cached here because the activity selection form is what renders them.
		// Nothing invalidates these two: `todoList`'s crud composables are not wrapped, so editing a
		// priority or a time period there leaves this copy stale until the next reload. They change
		// about as often as the enum they replaced, so that trade is deliberate — wire them up the same
		// way as the other three if that stops being true.
		const taskPriorityOptions = ref<SelectOption[]>([])
		const routineTimePeriodOptions = ref<SelectOption[]>([])

		const optionRefs: Record<ActivityOptionKind, Ref<SelectOption[]>> = {
			role: roleOptions,
			category: categoryOptions,
			activity: activityOptions,
			taskPriority: taskPriorityOptions,
			routineTimePeriod: routineTimePeriodOptions,
		}

		const combinationsBySource = ref(new Map<ActivityOptionsSource, ActivitySelectOptionCombination[]>()) as Ref<
			Map<ActivityOptionsSource, ActivitySelectOptionCombination[]>
		>

		// Which role a quick-created activity lands under. A per-session constant that quick-create used
		// to re-fetch on every single create.
		const systemRoleIds = ref(new Map<SystemActivityRole, number>()) as Ref<Map<SystemActivityRole, number>>

		const loadedKeys = ref(new Set<ActivityOptionsCacheKey>())
		const loadingKeys = ref(new Set<ActivityOptionsCacheKey>())

		// Deliberately not reactive: nothing renders off an in-flight promise, and a reactive Map of
		// promises would make every await a dependency of every consumer.
		const inFlight = new Map<ActivityOptionsCacheKey, Promise<unknown>>()

		// Bumped whenever a key is invalidated. A request that was already in flight when the data
		// changed under it must not write its now-stale answer into the cache — without this guard a
		// mutation landing mid-fetch caches exactly the state it was supposed to replace.
		const generations = new Map<ActivityOptionsCacheKey, number>()

		function generationOf(key: ActivityOptionsCacheKey) {
			return generations.get(key) ?? 0
		}

		function bumpGeneration(key: ActivityOptionsCacheKey) {
			generations.set(key, generationOf(key) + 1)
			loadedKeys.value.delete(key)
			inFlight.delete(key)
			// A superseded request no longer touches these, so its slot has to be released here.
			loadingKeys.value.delete(key)
		}

		function isLoading(key: ActivityOptionsCacheKey) {
			return loadingKeys.value.has(key)
		}

		/**
		 * Runs `load` unless the same key is already in flight, in which case the existing promise is
		 * returned. `load` receives a predicate that reports whether its result is still wanted. A
		 * rejection is not cached — the key simply stays unloaded and the next consumer retries.
		 */
		function share<T>(key: ActivityOptionsCacheKey, load: (isCurrent: () => boolean) => Promise<T>): Promise<T> {
			const existing = inFlight.get(key) as Promise<T> | undefined
			if (existing) return existing

			const startedAt = generationOf(key)
			loadingKeys.value.add(key)
			const promise = load(() => generationOf(key) === startedAt).finally(() => {
				// Only clear the slot if it is still ours; an invalidation may have replaced it with a
				// newer request that is still running.
				if (generationOf(key) !== startedAt) return
				inFlight.delete(key)
				loadingKeys.value.delete(key)
			})
			inFlight.set(key, promise)
			return promise
		}

		/**
		 * The cached list, or the single shared request that is fetching it.
		 *
		 * Resolves to a shallow copy: several call sites still assign the result into a local `ref`, and
		 * one of them appending a just-created option would otherwise be writing into the cache every
		 * other consumer reads. Bind `roleOptions` and friends from `useActivitySelectOptions()` when
		 * the component wants to keep following the shared list.
		 */
		function ensureOptions(kind: ActivityOptionKind): Promise<SelectOption[]> {
			if (loadedKeys.value.has(kind)) return Promise.resolve([...optionRefs[kind].value])
			return share(kind, async isCurrent => {
				const options = await fetchActivityOptions(kind)
				if (!isCurrent()) return [...optionRefs[kind].value]
				optionRefs[kind].value = options
				loadedKeys.value.add(kind)
				return [...options]
			})
		}

		/** The cached matrix for `source`, or the single shared request that is fetching it. Also a copy. */
		function ensureCombinations(source: ActivityOptionsSource): Promise<ActivitySelectOptionCombination[]> {
			const key = combinationsKey(source)
			if (loadedKeys.value.has(key)) return Promise.resolve([...(combinationsBySource.value.get(source) ?? [])])
			return share(key, async isCurrent => {
				const combinations = await fetchActivityFormSelectOptionCombinations(source)
				if (!isCurrent()) return [...(combinationsBySource.value.get(source) ?? combinations)]
				combinationsBySource.value.set(source, combinations)
				loadedKeys.value.add(key)
				return [...combinations]
			})
		}

		/**
		 * The cached id of a system role, or the single shared request resolving it. `null` means it could
		 * not be resolved — the seeded role was renamed or deleted, or the request failed.
		 *
		 * A miss is deliberately **not** cached: the user can go and fix the role in
		 * `/activity-settings/roles`, and a cached `null` would keep quick-create broken for the rest of
		 * the session. A hit is cached until any role mutation invalidates it (see `invalidate`).
		 */
		function ensureSystemRoleId(role: SystemActivityRole): Promise<number | null> {
			const key = systemRoleKey(role)
			if (loadedKeys.value.has(key)) return Promise.resolve(systemRoleIds.value.get(role) ?? null)
			return share(key, async isCurrent => {
				const id = await fetchSystemActivityRoleId(role)
				if (!isCurrent()) return systemRoleIds.value.get(role) ?? null
				if (id == null) return null
				systemRoleIds.value.set(role, id)
				loadedKeys.value.add(key)
				return id
			})
		}

		/** Every system-role slot is stale — a role was created, renamed or deleted. */
		function invalidateSystemRoleIds() {
			for (const role of Object.values(SystemActivityRole)) {
				bumpGeneration(systemRoleKey(role))
			}
			systemRoleIds.value.clear()
		}

		/**
		 * Add an option the user has just created, without waiting for a round trip. Consumers used to
		 * push into their own local array, so only the component that opened the create dialog saw the
		 * new role; going through the store means every mounted picker sees it.
		 */
		function addOption(kind: ActivityOptionKind, option: SelectOption) {
			const list = optionRefs[kind]
			if (list.value.some(existing => existing.id === option.id)) return
			list.value = [...list.value, option]
		}

		/**
		 * Drop the whole matrix. Unlike the plain lists it cannot be patched: a new activity changes
		 * *which* role/category combinations exist, and the answer depends on server-side rules the
		 * client does not model. Mounted selection forms hold their own copy of the rows they loaded,
		 * so dropping the cache never blanks a form that is already open — the next mount refetches.
		 */
		function invalidateCombinations() {
			// Every source, not just the ones with an entry: one may be in flight and have nothing
			// cached yet, and that request needs discarding too.
			for (const source of Object.values(ActivityOptionsSource)) {
				bumpGeneration(combinationsKey(source))
			}
			combinationsBySource.value.clear()
		}

		/**
		 * The server copy of `kind` changed. Refresh what we hold rather than only marking it stale:
		 * pickers that are on screen right now (the settings view's role filter while a role is created
		 * in the roles tab) have no reason to re-run `ensureOptions`, so a stale mark would never reach
		 * them. Values are kept until the replacement lands, so nothing blanks mid-flight.
		 *
		 * Any of the three matrix kinds changing stales the matrix, so it goes with them; the two
		 * `todoList` lookups are not in the matrix and leave it alone.
		 *
		 * A role mutation additionally stales the system-role ids. That is not optional while the lookup
		 * still goes through the display name: renaming "To-do list task" changes the answer without
		 * changing the id, which is the exact failure this prompt exists to fix.
		 */
		function invalidate(kind: ActivityOptionKind) {
			const wasLoaded = loadedKeys.value.has(kind)
			bumpGeneration(kind)
			if (MATRIX_KINDS.includes(kind)) invalidateCombinations()
			if (kind === 'role') invalidateSystemRoleIds()

			// Nothing has asked for this list yet, so there is nothing on screen to refresh.
			if (!wasLoaded) return
			// Failure leaves the old values in place and the key unloaded; the next mount retries.
			void ensureOptions(kind).catch(() => {})
		}

		function resetStore() {
			for (const list of Object.values(optionRefs)) list.value = []
			combinationsBySource.value.clear()
			systemRoleIds.value.clear()
			for (const key of loadedKeys.value) generations.set(key, generationOf(key) + 1)
			for (const key of loadingKeys.value) generations.set(key, generationOf(key) + 1)
			loadedKeys.value.clear()
			loadingKeys.value.clear()
			inFlight.clear()
		}

		// A Pinia store is a singleton for the tab's lifetime, so signing in as someone else in the same
		// tab would otherwise show the first account's roles and activities — and keep them marked
		// loaded, so they would never be re-read.
		watch(
			() => useUserStore().currentUser.id,
			() => resetStore(),
		)

		return {
			roleOptions,
			categoryOptions,
			activityOptions,
			taskPriorityOptions,
			routineTimePeriodOptions,
			combinationsBySource,
			systemRoleIds,
			loadingKeys,
			isLoading,
			ensureOptions,
			ensureCombinations,
			ensureSystemRoleId,
			addOption,
			invalidate,
			invalidateCombinations,
			invalidateSystemRoleIds,
			resetStore,
		}
	},
	{ persist: false },
)

/**
 * Wraps a mutating request so the option cache refreshes once it resolves. Applied in the crud
 * composables in `api/` rather than at the call sites, so a component never has to know the cache
 * exists. A rejected mutation invalidates nothing.
 */
export function invalidatingActivityOptions<TArgs extends unknown[], TResult>(
	kind: ActivityOptionKind,
	mutate: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
	return async (...args: TArgs) => {
		const result = await mutate(...args)
		useActivityOptionsStore().invalidate(kind)
		return result
	}
}
