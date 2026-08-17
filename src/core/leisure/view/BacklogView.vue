<template>
	<div class="py-4 h-100 w-100 d-flex flex-column ga-2">
		<div class="d-flex align-center ga-3">
			<h2 class="text-h6">{{ $t('leisure.backlog') }}</h2>
			<FilterPanel
				v-model="filter"
				class="flex-1-1"
				:defaultFactory="() => new ActivityBacklogProfileFilter()"
				:chipFormatters="chipFormatters"
			>
				<template #fields="{ draft }">
					<VTextField
						v-model="draft.activityName"
						:label="$t('leisure.fields.activity')"
						hideDetails
					/>
					<VIdSelect
						v-model="draft.locationTypeIds"
						:label="$t('leisure.fields.locationType')"
						:items="locationTypeOptions"
						multiple
						chips
						density="compact"
						hideDetails
					/>
					<VIdSelect
						v-model="draft.weatherDependencyIds"
						:label="$t('leisure.fields.weatherDependency')"
						:items="weatherDependencyOptions"
						multiple
						chips
						density="compact"
						hideDetails
					/>
					<EnumMultiSelect
						v-model="draft.energyLevels"
						:label="$t('leisure.fields.energyLevel')"
						:items="energyOptions"
					/>
					<EnumMultiSelect
						v-model="draft.effortTypes"
						:label="$t('leisure.fields.effortType')"
						:items="effortOptions"
					/>
					<VIdSelect
						v-model="draft.expectedCostTierIds"
						:label="$t('leisure.fields.expectedCostTier')"
						:items="expectedCostTierOptions"
						multiple
						chips
						density="compact"
						hideDetails
					/>
					<VNumberInput
						v-model="draft.maxDurationMinutes"
						:label="$t('leisure.fields.durationMinutes')"
						:min="0"
						:max="100000"
						:step="15"
						clearable
						hideDetails
					/>
					<NullFalseTrueCheckbox
						v-model="draft.isOneTime"
						:label="$t('leisure.fields.isOneTime')"
						hideDetails
					/>
				</template>
			</FilterPanel>
		</div>
		<div class="flex-fill">
			<BacklogTable
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
	import { onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import BacklogTable from '@/core/leisure/component/backlog/BacklogTable.vue'
	import EnumMultiSelect from '@/core/leisure/component/EnumMultiSelect.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
	import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
	import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import {
		useActivityLocationTypeApi,
		useActivityWeatherDependencyApi,
		useActivityExpectedCostTierApi,
	} from '@/core/leisure/api/activityLookupApi.ts'
	import { useServerTable } from '@/_common/composable/table/useServerTable.ts'
	import { useActivityBacklogProfileCrud } from '@/core/leisure/api/activityBacklogProfileApi.ts'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
	import { backlogFilterUrlState } from '@/core/leisure/composable/leisureFilterUrlState.ts'
	import { useLeisureFilterChips } from '@/core/leisure/composable/useLeisureFilterChips.ts'

	const i18n = useI18n()
	const { textChip, countChip, boolChip } = useLeisureFilterChips()

	const { fetchFilteredTable } = useActivityBacklogProfileCrud()
	// The view owns the table state because FilterPanel needs the same writable filter ref.
	const { items, itemsLength, loading, page, itemsPerPage, sortBy, filter, load, reload } = useServerTable<
		ActivityBacklogProfile,
		ActivityBacklogProfileFilter
	>({
		fetch: fetchFilteredTable,
		...backlogFilterUrlState(),
	})

	const { fetchAll: fetchLocationTypes } = useActivityLocationTypeApi()
	const { fetchAll: fetchWeatherDependencies } = useActivityWeatherDependencyApi()
	const { fetchAll: fetchExpectedCostTiers } = useActivityExpectedCostTierApi()

	const locationTypeOptions = ref<LookupResponse[]>([])
	const weatherDependencyOptions = ref<LookupResponse[]>([])
	const expectedCostTierOptions = ref<LookupResponse[]>([])

	const energyOptions = getEnumSelectOptions(EnergyLevel, 'enums.energyLevel')
	const effortOptions = getEnumSelectOptions(EffortType, 'enums.effortType')

	onMounted(async () => {
		;[locationTypeOptions.value, weatherDependencyOptions.value, expectedCostTierOptions.value] = await Promise.all(
			[fetchLocationTypes(), fetchWeatherDependencies(), fetchExpectedCostTiers()],
		)
	})

	const chipFormatters: ChipFormatters<ActivityBacklogProfileFilter> = {
		activityName: textChip('leisure.fields.activity', 'magnifying-glass'),
		locationTypeIds: countChip('leisure.fields.locationType', 'location-dot'),
		weatherDependencyIds: countChip('leisure.fields.weatherDependency', 'cloud-sun'),
		energyLevels: countChip('leisure.fields.energyLevel', 'bolt'),
		effortTypes: countChip('leisure.fields.effortType', 'dumbbell'),
		expectedCostTierIds: countChip('leisure.fields.expectedCostTier', 'sack-dollar'),
		maxDurationMinutes: v =>
			v != null ? { label: `${i18n.t('leisure.fields.durationMinutes')} ≤ ${v}`, icon: 'clock' } : null,
		isOneTime: boolChip('leisure.fields.isOneTime', 'star', 'rotate'),
	}
</script>
