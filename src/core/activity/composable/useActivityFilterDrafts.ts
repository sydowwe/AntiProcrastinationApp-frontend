import { onMounted, ref, watch, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'
import { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
import { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
import {
	activityFilterToParams,
	archivedViewOf,
	ARCHIVED_VIEW_FILTER,
	type ArchivedView,
	buildCombobox,
	nameTextFilterToParams,
	paramsToActivityFilter,
	paramsToNameTextFilter,
} from '@/core/activity/composable/activitySettingsUrlParams.ts'
import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

export type ActivitySettingsTab = 'activities' | 'roles' | 'categories'

/**
 * Owns `ActivitySettingsView`'s draft <-> filter <-> URL watcher graph (theme D's impure half; the
 * pure parse/serialize functions live in `activitySettingsUrlParams.ts`).
 *
 * **The watcher graph is the hazard, and it is not a type error.** `currentSharedFilter()` resolves
 * against `activeTab`, so the two shared-draft watchers write to the roles filter or the categories
 * filter depending on when they fire. The route->state watcher (on `tab`) and the state->URL watcher
 * (on `activeTab`) guard each other with mirrored `if (newTab === activeTab.value) return` /
 * `if (newTab === tab()) return` early exits, which is what stops a tab click and a browser Back from
 * fighting over the query string. Reorder or drop either guard and everything still compiles, still
 * type-checks, and misbehaves only when switching tabs with filters set.
 */
export function useActivityFilterDrafts(
	tab: () => ActivitySettingsTab,
	roleOptions: Ref<SelectOption[]>,
	categoryOptions: Ref<SelectOption[]>,
	route: RouteLocationNormalizedLoaded,
	router: Router,
) {
	const activeTab = ref<ActivitySettingsTab>(tab())
	const activitiesFilter = ref(new ActivityFilter())
	const rolesFilter = ref(new NameTextFilter())
	const categoriesFilter = ref(new NameTextFilter())
	const roleCombobox = ref<(SelectOption | string)[]>([])
	const categoryCombobox = ref<(SelectOption | string)[]>([])

	const archivedView = ref<ArchivedView>('active')
	const activityNameDraft = ref('')
	const activityTextDraft = ref('')
	const sharedNameDraft = ref('')
	const sharedTextDraft = ref('')

	function currentSharedFilter(): NameTextFilter {
		return activeTab.value === 'roles' ? rolesFilter.value : categoriesFilter.value
	}

	function syncDraftsFromState() {
		activityNameDraft.value = activitiesFilter.value.name ?? ''
		activityTextDraft.value = activitiesFilter.value.text ?? ''
		archivedView.value = archivedViewOf(activitiesFilter.value.isArchived)
		const shared = currentSharedFilter()
		sharedNameDraft.value = shared.name ?? ''
		sharedTextDraft.value = shared.text ?? ''
	}

	function refreshActivityCombos() {
		roleCombobox.value = buildCombobox(
			activitiesFilter.value.roleIds,
			activitiesFilter.value.roleName,
			roleOptions.value,
		)
		categoryCombobox.value = buildCombobox(
			activitiesFilter.value.categoryIds,
			activitiesFilter.value.categoryName,
			categoryOptions.value,
		)
	}

	function hydrateTabFromQuery(forTab: ActivitySettingsTab) {
		if (forTab === 'activities') {
			activitiesFilter.value = paramsToActivityFilter(route.query)
		} else if (forTab === 'roles') {
			rolesFilter.value = paramsToNameTextFilter(route.query)
		} else {
			categoriesFilter.value = paramsToNameTextFilter(route.query)
		}
	}

	async function syncUrl() {
		const params =
			activeTab.value === 'activities'
				? activityFilterToParams(activitiesFilter.value)
				: nameTextFilterToParams(activeTab.value === 'roles' ? rolesFilter.value : categoriesFilter.value)
		try {
			await router.replace({ name: 'activitySettings', params: { tab: activeTab.value }, query: params })
		} catch {
			// navigation duplication is non-fatal for state sync
		}
	}

	hydrateTabFromQuery(activeTab.value)
	syncDraftsFromState()

	onMounted(() => {
		// Explicit, because a cache hit resolves without changing the refs and the watch below never
		// fires.
		if (activeTab.value === 'activities') refreshActivityCombos()
	})

	// A role or category created or deleted in the other tabs refreshes the shared lists; the chips
	// shown for the id filters are derived from them and have to follow.
	watch([roleOptions, categoryOptions], () => {
		if (activeTab.value === 'activities') refreshActivityCombos()
	})

	// route -> state: external navigation (browser back/forward, a direct link) changes the tab
	watch(tab, newTab => {
		if (newTab === activeTab.value) return
		activeTab.value = newTab
		hydrateTabFromQuery(newTab)
		syncDraftsFromState()
		if (newTab === 'activities') refreshActivityCombos()
	})

	// user-initiated tab click: push the new tab's own (already in-memory) filter state into the URL
	watch(activeTab, newTab => {
		if (newTab === tab()) return
		syncDraftsFromState()
		syncUrl()
	})

	watchDebounced(
		activityNameDraft,
		val => {
			activitiesFilter.value.name = val || null
		},
		{ debounce: 300 },
	)
	watchDebounced(
		activityTextDraft,
		val => {
			activitiesFilter.value.text = val || null
		},
		{ debounce: 300 },
	)
	// Not debounced: it is a three-way toggle, not typing, and one click should reload the table once.
	watch(archivedView, view => {
		const isArchived = ARCHIVED_VIEW_FILTER[view]
		if (activitiesFilter.value.isArchived === isArchived) return
		activitiesFilter.value.isArchived = isArchived
	})

	watchDebounced(
		sharedNameDraft,
		val => {
			currentSharedFilter().name = val || null
		},
		{ debounce: 300 },
	)
	watchDebounced(
		sharedTextDraft,
		val => {
			currentSharedFilter().text = val || null
		},
		{ debounce: 300 },
	)

	watch(
		activitiesFilter,
		() => {
			if (activeTab.value === 'activities') syncUrl()
		},
		{ deep: true },
	)
	watch(
		rolesFilter,
		() => {
			if (activeTab.value === 'roles') syncUrl()
		},
		{ deep: true },
	)
	watch(
		categoriesFilter,
		() => {
			if (activeTab.value === 'categories') syncUrl()
		},
		{ deep: true },
	)

	watch(
		roleCombobox,
		vals => {
			activitiesFilter.value.roleIds = vals.filter((v): v is SelectOption => typeof v !== 'string').map(v => v.id)
			const strings = vals.filter((v): v is string => typeof v === 'string')
			activitiesFilter.value.roleName = strings.length ? strings.join(' ') : null
		},
		{ deep: true },
	)

	watch(
		categoryCombobox,
		vals => {
			activitiesFilter.value.categoryIds = vals
				.filter((v): v is SelectOption => typeof v !== 'string')
				.map(v => v.id)
			const strings = vals.filter((v): v is string => typeof v === 'string')
			activitiesFilter.value.categoryName = strings.length ? strings.join(' ') : null
		},
		{ deep: true },
	)

	return {
		activeTab,
		activitiesFilter,
		rolesFilter,
		categoriesFilter,
		roleCombobox,
		categoryCombobox,
		archivedView,
		activityNameDraft,
		activityTextDraft,
		sharedNameDraft,
		sharedTextDraft,
	}
}
