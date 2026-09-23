<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-3">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.projects') }}</h2>
			<VBtnToggle
				v-model="viewMode"
				mandatory
				density="compact"
				variant="outlined"
				color="secondaryOutline"
			>
				<VBtn
					value="board"
					:title="$t('leisure.viewMode.board')"
					:aria-label="$t('leisure.viewMode.board')"
				>
					<VIcon icon="table-cells" />
				</VBtn>
				<VBtn
					value="table"
					:title="$t('leisure.viewMode.table')"
					:aria-label="$t('leisure.viewMode.table')"
				>
					<VIcon icon="list" />
				</VBtn>
			</VBtnToggle>
			<FilterPanel
				v-model="filter"
				:defaultFactory="() => new ActivityProjectProfileFilter()"
				:chipFormatters="chipFormatters"
			>
				<template #fields="{ draft }">
					<VTextField
						v-model="draft.activityName"
						:label="$t('leisure.fields.activity')"
						hideDetails
					/>
					<EnumMultiSelect
						v-model="draft.difficultyLevels"
						:label="$t('leisure.fields.difficultyLevel')"
						:items="difficultyOptions"
					/>
					<EnumMultiSelect
						v-model="draft.readinessStatuses"
						:label="$t('leisure.fields.readinessStatus')"
						:items="readinessOptions"
					/>
					<VTextField
						v-model="draft.projectArea"
						:label="$t('leisure.fields.projectArea')"
						hideDetails
					/>
					<NullFalseTrueCheckbox
						v-model="draft.isMessy"
						:label="$t('leisure.fields.isMessy')"
						hideDetails
					/>
				</template>
			</FilterPanel>
		</div>
		<div class="flex-fill">
			<ProjectReadinessBoard
				v-if="viewMode === 'board'"
				:items
				:loading
				:filtered="isFiltered"
				:failed
				@onReload="reload"
				@onClearFilters="clearFilters"
			/>
			<ProjectTable
				v-else
				:items
				:loading
				:itemsLength
				:filtered="isFiltered"
				v-model:page="page"
				v-model:itemsPerPage="itemsPerPage"
				v-model:sortBy="sortBy"
				@onLoadItems="load"
				@onReload="reload"
				@onClearFilters="clearFilters"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ProjectTable from '@/core/leisure/component/project/ProjectTable.vue'
	import ProjectReadinessBoard from '@/core/leisure/component/project/ProjectReadinessBoard.vue'
	import EnumMultiSelect from '@/core/leisure/component/EnumMultiSelect.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
	import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
	import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
	import { isRequestCanceled } from '@/_common/axiosConfig.ts'
	import { projectFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'
	import { useLeisureFilterChips } from '@/core/leisure/composable/useLeisureFilterChips.ts'

	const { textChip, countChip, boolChip } = useLeisureFilterChips()

	const { fetchFilteredTable } = useActivityProjectProfileCrud()
	// A rejected load must not render as "you have none" — the board shows its error branch instead.
	// A cancellation (a newer load superseded this one) is not a failure.
	const failed = ref(false)

	// Board and table are one fetch at two page sizes (F2). They used to be two callers of one
	// `fetchFilteredTable`, whose single AbortController made every board-mode filter change fire
	// two requests and cancel one — and the cancelled call resolves with the *other* call's result,
	// so the board could render the table's 25-row page. The view owns the table state because
	// FilterPanel needs the same writable filter ref.
	const { items, itemsLength, loading, page, itemsPerPage, sortBy, filter, load, reload } = useServerTable<
		ActivityProjectProfile,
		ActivityProjectProfileFilter
	>({
		fetch: async request => {
			const result = await fetchFilteredTable(request)
			failed.value = false
			return result
		},
		onError: error => {
			if (!isRequestCanceled(error)) failed.value = true
		},
		...projectFilterUrlState(),
	})

	// Board mode groups by readinessStatus rather than paging, so it needs every filtered row at
	// once. A hobby project list is small, so one oversized page is a simpler answer than a real
	// pagination scheme. Past 200 projects the board silently shows the first 200.
	//
	// 200 is not a preference — it is the server's cap. `BaseFilterSortPaginateRequest` validates
	// `itemsPerPage` with "Must not exceed 200.", so the previous 500 made every board load answer
	// 400 and the view rendered "0-0 of 0" no matter what was in the database. Board is also the
	// default mode, so this was the whole screen. Raising it means raising the server's validator
	// first.
	const BOARD_PAGE_SIZE = 200
	const DEFAULT_TABLE_PAGE_SIZE = 25
	const route = useRoute()
	const router = useRouter()
	function viewModeInUrl(): 'table' | 'board' {
		return route.query.view === 'table' ? 'table' : 'board'
	}
	const viewMode = ref(viewModeInUrl())
	// The table's own page size, parked while the board borrows `itemsPerPage`. A `perPage=200` in
	// the URL is the board's, not a choice the user made for the table.
	let tablePageSize = itemsPerPage.value === BOARD_PAGE_SIZE ? DEFAULT_TABLE_PAGE_SIZE : itemsPerPage.value

	// The table loads itself — `BasicTable` emits `onLoadItems` on mount — so only the board needs
	// an explicit load. Filter changes are `useServerTable`'s own watcher in both modes.
	watch(
		viewMode,
		(mode, previous) => {
			if (mode === 'board') {
				if (previous === 'table') tablePageSize = itemsPerPage.value
				itemsPerPage.value = BOARD_PAGE_SIZE
				page.value = 1
				load()
			} else {
				itemsPerPage.value = tablePageSize
			}
		},
		{ immediate: true },
	)

	const isFiltered = computed(() => filter.value?.hasAny() ?? false)

	function clearFilters() {
		filter.value = new ActivityProjectProfileFilter()
	}

	// `useTableUrlState` also writes the query, and a replace of its started in the same tick as ours
	// cancels ours outright — `view` never lands. So re-check after every navigation that settles,
	// spreading the query as it is then, rather than trusting the order of the two writers (F1).
	// The path guard stops the check stamping `view` onto the next page while this one unmounts.
	const ownPath = route.path
	function writeViewToUrl() {
		if (route.path !== ownPath || viewModeInUrl() === viewMode.value) return
		void router.replace({ query: { ...route.query, view: viewMode.value } })
	}
	watch([viewMode, () => route.fullPath], writeViewToUrl)

	const difficultyOptions = getEnumSelectOptions(DifficultyLevel, 'enums.difficultyLevel')
	const readinessOptions = getEnumSelectOptions(ReadinessStatus, 'enums.readinessStatus')

	const chipFormatters: ChipFormatters<ActivityProjectProfileFilter> = {
		activityName: textChip('leisure.fields.activity', 'magnifying-glass'),
		difficultyLevels: countChip('leisure.fields.difficultyLevel', 'gauge'),
		readinessStatuses: countChip('leisure.fields.readinessStatus', 'circle-check'),
		projectArea: textChip('leisure.fields.projectArea', 'map'),
		isMessy: boolChip('leisure.fields.isMessy', 'broom', 'soap'),
	}
</script>
