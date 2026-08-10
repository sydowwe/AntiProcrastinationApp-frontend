<template>
	<SubtleCard class="pa-3">
		<div class="d-flex flex-column ga-3">
			<VTextField
				v-model="model.activityName"
				:label="$t('leisure.fields.activity')"
				clearable
				hideDetails
				density="compact"
			/>
			<VSelect
				v-model="model.locationTypes as LocationType[] | null"
				:label="$t('leisure.fields.locationType')"
				:items="locationOptions"
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
				v-model="model.weatherDependencies as WeatherDependency[] | null"
				:label="$t('leisure.fields.weatherDependency')"
				:items="weatherOptions"
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
				v-model="model.energyLevels as EnergyLevel[] | null"
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
				v-model="model.effortTypes as EffortType[] | null"
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
				v-model="model.expectedCostTiers as ExpectedCostTier[] | null"
				:label="$t('leisure.fields.expectedCostTier')"
				:items="costOptions"
				itemValue="value"
				itemTitle="title"
				multiple
				chips
				clearable
				variant="outlined"
				density="compact"
				hideDetails
			/>
			<VNumberInput
				v-model="model.maxDurationMinutes as number | null"
				:label="$t('leisure.fields.durationMinutes')"
				:min="0"
				:max="100000"
				:step="15"
				clearable
				density="compact"
				hideDetails
			/>
			<NullFalseTrueCheckbox
				v-model="model.isOneTime"
				:label="$t('leisure.fields.isOneTime')"
			/>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import type { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'
	import { LocationType } from '@/core/leisure/dto/enum/LocationType.ts'
	import { WeatherDependency } from '@/core/leisure/dto/enum/WeatherDependency.ts'
	import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
	import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
	import { ExpectedCostTier } from '@/core/leisure/dto/enum/ExpectedCostTier.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'

	const model = defineModel<ActivityBacklogProfileFilter>({ required: true })

	const locationOptions = getEnumSelectOptions(LocationType, 'enums.locationType')
	const weatherOptions = getEnumSelectOptions(WeatherDependency, 'enums.weatherDependency')
	const energyOptions = getEnumSelectOptions(EnergyLevel, 'enums.energyLevel')
	const effortOptions = getEnumSelectOptions(EffortType, 'enums.effortType')
	const costOptions = getEnumSelectOptions(ExpectedCostTier, 'enums.expectedCostTier')
</script>
