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
					<VSelect
						v-model="draft.locationTypeIds"
						:label="$t('leisure.fields.locationType')"
						:items="locationTypeOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						clearable
						variant="outlined"
						density="compact"
						hideDetails
					/>
					<VSelect
						v-model="draft.weatherDependencyIds"
						:label="$t('leisure.fields.weatherDependency')"
						:items="weatherDependencyOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						clearable
						variant="outlined"
						density="compact"
						hideDetails
					/>
					<VSelect
						v-model="draft.energyLevels"
						:label="$t('leisure.fields.energyLevel')"
						:items="energyOptions"
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
						v-model="draft.effortTypes"
						:label="$t('leisure.fields.effortType')"
						:items="effortOptions"
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
						v-model="draft.expectedCostTierIds"
						:label="$t('leisure.fields.expectedCostTier')"
						:items="expectedCostTierOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						clearable
						variant="outlined"
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
			<BacklogTable :filter />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import FilterPanel, { type ChipFormatters } from '@/_common/component/FilterPanel.vue'
	import BacklogTable from '@/core/leisure/component/backlog/BacklogTable.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
	import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
	import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import {
		useActivityLocationTypeApi,
		useActivityWeatherDependencyApi,
		useActivityExpectedCostTierApi,
	} from '@/core/leisure/api/activityLookupApi.ts'

	const i18n = useI18n()
	const filter = ref(new ActivityBacklogProfileFilter())

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
		activityName: v =>
			v ? { label: `${i18n.t('leisure.fields.activity')}: ${v}`, icon: 'magnifying-glass' } : null,
		locationTypeIds: v =>
			v?.length
				? { label: `${i18n.t('leisure.fields.locationType')} (${v.length})`, icon: 'location-dot' }
				: null,
		weatherDependencyIds: v =>
			v?.length
				? { label: `${i18n.t('leisure.fields.weatherDependency')} (${v.length})`, icon: 'cloud-sun' }
				: null,
		energyLevels: v =>
			v?.length ? { label: `${i18n.t('leisure.fields.energyLevel')} (${v.length})`, icon: 'bolt' } : null,
		effortTypes: v =>
			v?.length ? { label: `${i18n.t('leisure.fields.effortType')} (${v.length})`, icon: 'dumbbell' } : null,
		expectedCostTierIds: v =>
			v?.length
				? { label: `${i18n.t('leisure.fields.expectedCostTier')} (${v.length})`, icon: 'sack-dollar' }
				: null,
		maxDurationMinutes: v =>
			v != null ? { label: `${i18n.t('leisure.fields.durationMinutes')} ≤ ${v}`, icon: 'clock' } : null,
		isOneTime: v => {
			if (v == null) return null
			return {
				label: `${i18n.t('leisure.fields.isOneTime')}: ${v ? '✓' : '✗'}`,
				icon: v ? 'star' : 'rotate',
			}
		},
	}
</script>
