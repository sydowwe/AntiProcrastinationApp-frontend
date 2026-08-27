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

/**
 * Whether a cached matrix includes archived activities. Two slots per source rather than one, because
 * the history filter panel and a record-creating form ask the same endpoint for genuinely different
 * answers and neither may serve the other's copy.
 */
type CombinationScope = 'active' | 'withArchived'

/** One cache slot: a plain list, a combination matrix per source and scope, or a system role's id. */
export type ActivityOptionsCacheKey =
	| ActivityOptionKind
	| `combinations:${ActivityOptionsSource}:${CombinationScope}`
	| `systemRole:${SystemActivityRole}`

/** Every list the store owns. All three feed the combination matrix, so any of them stales it. */
const OPTION_KINDS: readonly ActivityOptionKind[] = ['role', 'category', 'activity']

function combinationsKey(source: ActivityOptionsSource, includeArchived: boolean): ActivityOptionsCacheKey {
	return `combinations:${source}:${includeArchived ? 'withArchived' : 'active'}`
}

function systemRoleKey(role: SystemActivityRole): ActivityOptionsCacheKey {
	return `systemRole:${role}`
}

/**
 * Shared cache for the role/category/activity select options and the per-source combination matrix.
 *
 * The point is less latency than *shared identity*: a role created in one dialog has to appear in
 * every mounted picker, which needs one list rather than a copy per component whatever the requests
 * cost. Deduplication comes along with that — several consumers mount in the same tick (a to-do
 * dialog mounts a category field and a selection form together) and share one request per key.
 *
 * The matrix is the part actually worth caching: O(activities) rows with nested option objects,
 * describing data that changes maybe weekly.
 *
 * Invalidation lives in `api/`, not in components — every mutation goes through the three crud
 * composables, which wrap their commands in `invalidatingActivityOptions`.
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

		const optionRefs: Record<ActivityOptionKind, Ref<SelectOption[]>> = {
			role: roleOptions,
			category: categoryOptions,
			activity: activityOptions,
		}

		// Keyed by the cache key, not by source: a source has one slot per scope and they hold different
		// rows, so a single per-source map would let the history filter's archived-inclusive copy answer a
		// to-do dialog's request for the active-only one.
		const combinationsByKey = ref(new Map<ActivityOptionsCacheKey, ActivitySelectOptionCombination[]>()) as Ref<
			Map<ActivityOptionsCacheKey, ActivitySelectOptionCombination[]>
		>

		// Which role a quick-created activity lands under. A per-session constant that quick-create used
		// to re-fetch on every single create.
		const systemRoleIds = ref(new Map<SystemActivityRole, number>()) as Ref<Map<SystemActivityRole, number>>

		const loadedKeys = ref(new Set<ActivityOptionsCacheKey>())
		const loadingKeys = ref(new Set<ActivityOptionsCacheKey>())

		// Deliberately not reactive: nothing renders off an in-flight promise, and a reactive Map of
		// promises would make every await a dependency of every consumer.
		const inFlight = new Map<ActivityOptionsCacheKey, Promise<unknown>>()

		/**
		 * Bumped by every invalidation and by `resetStore`. A request already in flight when it fires must
		 * not write its answer into the cache.
		 *
		 * One counter for the whole store rather than one per key: after a sign-in as someone else, a
		 * request still running is carrying the *previous account's* rows and would land in a store that
		 * was just cleared. That is the case worth guarding. The mid-invalidation race it also covers is
		 * near-theoretical, since `invalidate` refetches immediately anyway.
		 */
		let epoch = 0

		function isLoading(key: ActivityOptionsCacheKey) {
			return loadingKeys.value.has(key)
		}

		/** Forget one slot, in-flight request included, without touching the value it holds. */
		function dropKey(key: ActivityOptionsCacheKey) {
			loadedKeys.value.delete(key)
			loadingKeys.value.delete(key)
			inFlight.delete(key)
		}

		/**
		 * Runs `load` unless the same key is already in flight, in which case the existing promise is
		 * returned. A rejection is not cached — the key simply stays unloaded and the next consumer
		 * retries.
		 */
		function share<T>(key: ActivityOptionsCacheKey, load: () => Promise<T>): Promise<T> {
			const existing = inFlight.get(key) as Promise<T> | undefined
			if (existing) return existing

			loadingKeys.value.add(key)
			const promise: Promise<T> = load().finally(() => {
				// Only clear the slot if it is still ours: an invalidation may have dropped it and a newer
				// request may already be running under the same key.
				if (inFlight.get(key) !== promise) return
				inFlight.delete(key)
				loadingKeys.value.delete(key)
			})
			inFlight.set(key, promise)
			return promise
		}

		/**
		 * The cached list, or the single shared request that is fetching it.
		 *
		 * Resolves to a shallow copy so a caller assigning it into a local `ref` cannot mutate the shared
		 * list every other consumer reads. Bind `roleOptions` and friends from `useActivitySelectOptions()`
		 * when the component wants to keep following the shared list instead.
		 */
		function ensureOptions(kind: ActivityOptionKind): Promise<SelectOption[]> {
			if (loadedKeys.value.has(kind)) return Promise.resolve([...optionRefs[kind].value])
			return share(kind, async () => {
				const startedAt = epoch
				const options = await fetchActivityOptions(kind)
				if (epoch !== startedAt) return [...optionRefs[kind].value]
				optionRefs[kind].value = options
				loadedKeys.value.add(kind)
				return [...options]
			})
		}

		/**
		 * Warm the three lists. Named for the framework convention: `createAppPinia()` installs a plugin
		 * that calls `ensureLoaded()` on any store exposing it, at creation, so that no component has to
		 * call it in `onMounted`. `App.vue` creates this store at boot, which is what triggers it.
		 *
		 * Idempotent, de-duplicated and never rejecting, so the plugin's uncaught call is safe and so is
		 * calling it again by hand.
		 *
		 * Does nothing while signed out: the three endpoints are behind the auth guard and a visitor on
		 * the login screen has no business firing them. Sign-in is covered by the watcher below, not by a
		 * second plugin call — the plugin only ever fires once, at creation.
		 */
		async function ensureLoaded(): Promise<void> {
			if (!useUserStore().isAuthenticated) return
			// Swallowed: this is a warm-up with no call site to report to, and the axios interceptor has
			// already shown a snackbar. A failed list stays unloaded and the next call retries it.
			await Promise.all(OPTION_KINDS.map(kind => ensureOptions(kind).catch(() => [])))
		}

		/**
		 * The cached matrix for `source`, or the single shared request that is fetching it. Also a copy —
		 * `useActivitySelectionFormState` pushes a locally synthesised row into what it gets back, and that
		 * row must not reach the shared cache.
		 *
		 * `includeArchived` is a separate cache slot rather than a filter over one: the server decides what
		 * an archived activity means to each source, and the archived-inclusive answer is a superset only
		 * by convention. Almost nothing passes `true` — the history *filter* panel does, because the
		 * records it filters over stay visible after their activity is archived.
		 */
		function ensureCombinations(
			source: ActivityOptionsSource,
			includeArchived = false,
		): Promise<ActivitySelectOptionCombination[]> {
			const key = combinationsKey(source, includeArchived)
			if (loadedKeys.value.has(key)) return Promise.resolve([...(combinationsByKey.value.get(key) ?? [])])
			return share(key, async () => {
				const startedAt = epoch
				const combinations = await fetchActivityFormSelectOptionCombinations(source, includeArchived)
				if (epoch !== startedAt) return [...(combinationsByKey.value.get(key) ?? combinations)]
				combinationsByKey.value.set(key, combinations)
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
			return share(key, async () => {
				const startedAt = epoch
				const id = await fetchSystemActivityRoleId(role)
				if (epoch !== startedAt) return systemRoleIds.value.get(role) ?? null
				if (id == null) return null
				systemRoleIds.value.set(role, id)
				loadedKeys.value.add(key)
				return id
			})
		}

		/** Every system-role slot is stale — a role was created, renamed or deleted. */
		function invalidateSystemRoleIds() {
			epoch++
			for (const role of Object.values(SystemActivityRole)) dropKey(systemRoleKey(role))
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
			epoch++
			// Every source and both scopes, not just the ones with an entry: one may be in flight and have
			// nothing cached yet, and that request needs discarding too. Archiving an activity changes both
			// scopes at once — it leaves the active matrix and enters the archived-inclusive one — so
			// dropping only the scope the mutation "belongs to" would leave the other stale.
			for (const source of Object.values(ActivityOptionsSource)) {
				dropKey(combinationsKey(source, false))
				dropKey(combinationsKey(source, true))
			}
			combinationsByKey.value.clear()
		}

		/**
		 * The server copy of `kind` changed. Refresh what we hold rather than only marking it stale:
		 * pickers that are on screen right now (the settings view's role filter while a role is created
		 * in the roles tab) have no reason to re-run `ensureOptions`, so a stale mark would never reach
		 * them. Values are kept until the replacement lands, so nothing blanks mid-flight.
		 *
		 * All three kinds feed the matrix, so it always goes with them. A role mutation additionally
		 * stales the system-role ids — not optional while a rename can change which role a system key
		 * resolves to.
		 */
		function invalidate(kind: ActivityOptionKind) {
			epoch++
			const wasLoaded = loadedKeys.value.has(kind)
			dropKey(kind)
			invalidateCombinations()
			if (kind === 'role') invalidateSystemRoleIds()

			// Nothing has asked for this list yet, so there is nothing on screen to refresh.
			if (!wasLoaded) return
			// Failure leaves the old values in place and the key unloaded; the next mount retries.
			void ensureOptions(kind).catch(() => {})
		}

		function resetStore() {
			epoch++
			for (const list of Object.values(optionRefs)) list.value = []
			combinationsByKey.value.clear()
			systemRoleIds.value.clear()
			loadedKeys.value.clear()
			loadingKeys.value.clear()
			inFlight.clear()
		}

		// A Pinia store is a singleton for the tab's lifetime, so signing in as someone else in the same
		// tab would otherwise show the first account's roles and activities — and keep them marked
		// loaded, so they would never be re-read. Reloading straight away keeps the guarantee `App.vue`'s
		// boot call gives on a page load: by the time a picker mounts, the lists are on their way.
		watch(
			() => useUserStore().currentUser.id,
			() => {
				resetStore()
				void ensureLoaded()
			},
		)

		return {
			roleOptions,
			categoryOptions,
			activityOptions,
			combinationsByKey,
			systemRoleIds,
			loadingKeys,
			isLoading,
			ensureLoaded,
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
