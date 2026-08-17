<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-3">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.projects') }}</h2>
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
			<ProjectTable
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
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ProjectTable from '@/core/leisure/component/project/ProjectTable.vue'
	import EnumMultiSelect from '@/core/leisure/component/EnumMultiSelect.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
	import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
	import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
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
