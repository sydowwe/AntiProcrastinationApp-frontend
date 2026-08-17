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
				>
					<VIcon icon="table-cells" />
				</VBtn>
				<VBtn
					value="table"
					:title="$t('leisure.viewMode.table')"
				>
					<VIcon icon="list" />
				</VBtn>
			</VBtnToggle>
			<FilterPanel
				v-model="filter"
				class="flex-1-1"
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
				:items="boardItems"
				:loading="boardLoading"
				@onReload="loadBoard"
			/>
			<ProjectTable
				v-else
				:items
				:loading
				:itemsLength
				v-model:page="page"
				v-model:itemsPerPage="itemsPerPage"
				v-model:sortBy="sortBy"
				@onLoadItems="load"
				@onReload="reload"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
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
	import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
	import { projectFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'
	import { useLeisureFilterChips } from '@/core/leisure/composable/useLeisureFilterChips.ts'

	const { textChip, countChip, boolChip } = useLeisureFilterChips()

	const { fetchFilteredTable } = useActivityProjectProfileCrud()
	// The view owns the table state because FilterPanel needs the same writable filter ref.
	const { items, itemsLength, loading, page, itemsPerPage, sortBy, filter, load, reload } = useServerTable<
		ActivityProjectProfile,
		ActivityProjectProfileFilter
	>({
		fetch: fetchFilteredTable,
		...projectFilterUrlState(),
	})

	// Board mode groups by readinessStatus rather than paging, so it needs every filtered row at
	// once. A hobby project list is small; a five-figure page size is a generous, simple cap rather
	// than a real pagination scheme.
	const BOARD_PAGE_SIZE = 500
	const route = useRoute()
	const router = useRouter()
	const viewMode = ref<'table' | 'board'>(route.query.view === 'table' ? 'table' : 'board')
	const boardItems = ref<ActivityProjectProfile[]>([])
	const boardLoading = ref(false)

	async function loadBoard() {
		boardLoading.value = true
		try {
			const request = new FilteredTableRequest<ActivityProjectProfileFilter>(
				BOARD_PAGE_SIZE,
				1,
				[],
				true,
				filter.value ?? new ActivityProjectProfileFilter(),
			)
			const result = await fetchFilteredTable(request)
			boardItems.value = result.items
		} finally {
			boardLoading.value = false
		}
	}

	watch(viewMode, value => router.replace({ query: { ...route.query, view: value } }))
	watch(
		[viewMode, filter],
		() => {
			if (viewMode.value === 'board') void loadBoard()
		},
		{ deep: true, immediate: true },
	)

	const difficultyOptions = getEnumSelectOptions(DifficultyLevel, 'enums.difficultyLevel')
	const readinessOptions = getEnumSelectOptions(ReadinessStatus, 'enums.readinessStatus')

	const chipFormatters: ChipFormatters<ActivityProjectProfileFilter> = {
		activityName: textChip('leisure.fields.activity', 'magnifying-glass'),
		difficultyLevels: countChip('leisure.fields.difficultyLevel', 'gauge'),
		readinessStatuses: countChip('leisure.fields.readinessStatus', 'circle-check'),
		projectArea: textChip('leisure.fields.projectArea', 'map'),
		isMessy: boolChip('leisure.fields.isMessy', 'broom'),
	}
</script>
