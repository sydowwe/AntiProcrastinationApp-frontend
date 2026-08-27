<template>
	<div class="py-4 h-100 w-100 d-flex flex-column">
		<div class="d-flex align-center">
			<VTabs
				v-model="activeTab"
				color="primaryOutline"
			>
				<VTab value="activities">{{ t('activities.activitiesTab') }}</VTab>
				<VTab value="roles">{{ t('activities.roles') }}</VTab>
				<VTab value="categories">{{ t('activities.categories') }}</VTab>
			</VTabs>
			<div class="d-flex ga-2 ml-14 flex-1-1">
				<template v-if="activeTab === 'activities'">
					<VTextField
						v-model="activityNameDraft"
						:label="t('general.name')"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="activityTextDraft"
						:label="t('general.text')"
						clearable
						hideDetails
						density="compact"
					/>
					<VCombobox
						v-model="roleCombobox"
						:label="t('activities.roles')"
						:items="roleOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						closableChips
						hideDetails
						density="compact"
					/>
					<VCombobox
						v-model="categoryCombobox"
						:label="t('activities.categories')"
						:items="categoryOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						closableChips
						hideDetails
						density="compact"
					/>
					<VBtnToggle
						v-model="archivedView"
						mandatory
						divided
						density="compact"
						variant="outlined"
						color="primaryOutline"
						class="flex-0-0"
					>
						<VBtn value="active">{{ t('activities.archive.viewActive') }}</VBtn>
						<VBtn value="archived">{{ t('activities.archive.viewArchived') }}</VBtn>
						<VBtn value="all">{{ t('activities.archive.viewAll') }}</VBtn>
					</VBtnToggle>
				</template>
				<template v-else>
					<VTextField
						v-model="sharedNameDraft"
						:label="t('general.name')"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="sharedTextDraft"
						:label="t('general.text')"
						clearable
						hideDetails
						density="compact"
					/>
				</template>
			</div>
		</div>
		<VTabsWindow
			v-model="activeTab"
			class="flex-fill mt-2"
		>
			<VTabsWindowItem
				value="activities"
				class="flex-fill"
			>
				<ActivityTable :filter="activitiesFilter" />
			</VTabsWindowItem>
			<VTabsWindowItem
				value="roles"
				class="flex-fill"
			>
				<RoleTable :filter="rolesFilter" />
			</VTabsWindowItem>
			<VTabsWindowItem
				value="categories"
				class="flex-fill"
			>
				<CategoryTable :filter="categoriesFilter" />
			</VTabsWindowItem>
		</VTabsWindow>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { watchDebounced } from '@vueuse/core'
	import { type LocationQuery, useRoute, useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import ActivityTable from '@/core/activity/component/ActivityTable.vue'
	import RoleTable from '@/core/activity/component/activityRole/ActivityRoleTable.vue'
	import CategoryTable from '@/core/activity/component/activityCategory/ActivityCategoryTable.vue'
	import { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
	import { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
	import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	type ActivitySettingsTab = 'activities' | 'roles' | 'categories'

	const { tab } = defineProps<{ tab: ActivitySettingsTab }>()

	const { t } = useI18n()
	// The shared cache's own refs: creating a role in the roles tab refreshes them, so the activities
	// tab's filter offers it without a reload.
	const { roleOptions, categoryOptions } = useActivitySelectOptions()
	const route = useRoute()
	const router = useRouter()

	function firstQueryString(value: unknown): string | undefined {
		const raw = Array.isArray(value) ? value.find(v => typeof v === 'string') : value
		return typeof raw === 'string' && raw !== '' ? raw : undefined
	}

	function parseIdList(value: unknown): number[] | null {
		const raw = firstQueryString(value)
		if (!raw) return null
		const ids = raw
			.split(',')
			.map(part => Number(part))
			.filter(n => Number.isInteger(n))
		return ids.length > 0 ? ids : null
	}

	/**
	 * Which lifecycle state the activities tab is showing. Three named views rather than a raw boolean
	 * because the URL has to say which one it is, and `archived=false` vs. `archived=` vs. absent is not
	 * a distinction a query string carries legibly.
	 */
	type ArchivedView = 'active' | 'archived' | 'all'

	const ARCHIVED_VIEW_FILTER: Record<ArchivedView, boolean | null> = {
		active: false,
		archived: true,
		all: null,
	}

	function parseArchivedView(value: unknown): ArchivedView {
		const raw = firstQueryString(value)
		return raw === 'archived' || raw === 'all' ? raw : 'active'
	}

	function archivedViewOf(isArchived: boolean | null): ArchivedView {
		if (isArchived === true) return 'archived'
		if (isArchived === null) return 'all'
		return 'active'
	}

	function paramsToActivityFilter(query: LocationQuery): ActivityFilter {
		return new ActivityFilter(
			firstQueryString(query.name) ?? null,
			firstQueryString(query.text) ?? null,
			firstQueryString(query.roleName) ?? null,
			parseIdList(query.roleIds),
			firstQueryString(query.categoryName) ?? null,
			parseIdList(query.categoryIds),
			ARCHIVED_VIEW_FILTER[parseArchivedView(query.archived)],
		)
	}

	function activityFilterToParams(filter: ActivityFilter): Record<string, string> {
		const params: Record<string, string> = {}
		if (filter.name) params.name = filter.name
		if (filter.text) params.text = filter.text
		if (filter.roleIds?.length) params.roleIds = filter.roleIds.join(',')
		if (filter.roleName) params.roleName = filter.roleName
		if (filter.categoryIds?.length) params.categoryIds = filter.categoryIds.join(',')
		if (filter.categoryName) params.categoryName = filter.categoryName
		// The default view stays out of the URL, so a shared link to an unfiltered table is still bare.
		const view = archivedViewOf(filter.isArchived)
		if (view !== 'active') params.archived = view
		return params
	}

	function paramsToNameTextFilter(query: LocationQuery): NameTextFilter {
		return new NameTextFilter(firstQueryString(query.name) ?? null, firstQueryString(query.text) ?? null)
	}

	function nameTextFilterToParams(filter: NameTextFilter): Record<string, string> {
		const params: Record<string, string> = {}
		if (filter.name) params.name = filter.name
		if (filter.text) params.text = filter.text
		return params
	}

	function buildCombobox(
		ids: number[] | null,
		freeText: string | null,
		options: SelectOption[],
	): (SelectOption | string)[] {
		const result: (SelectOption | string)[] = []
		for (const id of ids ?? []) {
			const match = options.find(o => o.id === id)
			if (match) result.push(match)
		}
		if (freeText) result.push(freeText)
		return result
	}

	const activeTab = ref<ActivitySettingsTab>(tab)
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

	onMounted(async () => {
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
	watch(
		() => tab,
		newTab => {
			if (newTab === activeTab.value) return
			activeTab.value = newTab
			hydrateTabFromQuery(newTab)
			syncDraftsFromState()
			if (newTab === 'activities') refreshActivityCombos()
		},
	)

	// user-initiated tab click: push the new tab's own (already in-memory) filter state into the URL
	watch(activeTab, newTab => {
		if (newTab === tab) return
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
</script>
