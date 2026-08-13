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
					<VSelect
						v-model="draft.difficultyLevels as DifficultyLevel[] | null"
						:label="$t('leisure.fields.difficultyLevel')"
						:items="difficultyOptions"
						itemValue="value"
						itemTitle="title"
						multiple
						chips
						clearable
						variant="outlined"
						density="compact"
						hideDetails
					/>
					<VSelect
						v-model="draft.readinessStatuses as ReadinessStatus[] | null"
						:label="$t('leisure.fields.readinessStatus')"
						:items="readinessOptions"
						itemValue="value"
						itemTitle="title"
						multiple
						chips
						clearable
						variant="outlined"
						density="compact"
						hideDetails
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
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import ProjectTable from '@/core/leisure/component/project/ProjectTable.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'
	import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
	import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
	import { projectFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'

	const i18n = useI18n()

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
		activityName: v =>
			v ? { label: `${i18n.t('leisure.fields.activity')}: ${v}`, icon: 'magnifying-glass' } : null,
		difficultyLevels: v =>
			v?.length ? { label: `${i18n.t('leisure.fields.difficultyLevel')} (${v.length})`, icon: 'gauge' } : null,
		readinessStatuses: v =>
			v?.length
				? { label: `${i18n.t('leisure.fields.readinessStatus')} (${v.length})`, icon: 'circle-check' }
				: null,
		projectArea: v => (v ? { label: `${i18n.t('leisure.fields.projectArea')}: ${v}`, icon: 'map' } : null),
		isMessy: v => {
			if (v == null) return null
			return {
				label: `${i18n.t('leisure.fields.isMessy')}: ${v ? '✓' : '✗'}`,
				icon: 'broom',
			}
		},
	}
</script>
