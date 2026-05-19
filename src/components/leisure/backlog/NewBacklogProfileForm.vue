<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent="validate"
	>
		<VIdAutocomplete
			v-model="model.activityId"
			:label="$t('leisure.fields.activity')"
			:items="activityOptions"
			required
			:rules="[requiredRule]"
			:disabled="lockActivity"
		/>
		<VSelect
			v-model="model.locationType"
			:label="$t('leisure.fields.locationType')"
			:items="locationOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
		/>
		<VSelect
			v-model="model.weatherDependency"
			:label="$t('leisure.fields.weatherDependency')"
			:items="weatherOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
		/>
		<VSelect
			v-model="model.energyLevel"
			:label="$t('leisure.fields.energyLevel')"
			:items="energyOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
		/>
		<VSelect
			v-model="model.effortType"
			:label="$t('leisure.fields.effortType')"
			:items="effortOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
			clearable
		/>
		<VSelect
			v-model="model.expectedCostTier"
			:label="$t('leisure.fields.expectedCostTier')"
			:items="costOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
		/>
		<div class="d-flex ga-3">
			<VNumberInput
				v-model="model.minParticipants"
				:label="$t('leisure.fields.minParticipants')"
				:min="1"
				:max="999"
				class="flex-1-1"
			/>
			<VNumberInput
				v-model="model.maxParticipants as number | null"
				:label="$t('leisure.fields.maxParticipants')"
				:min="model.minParticipants"
				:max="999"
				clearable
				class="flex-1-1"
			/>
		</div>
		<VNumberInput
			v-model="model.durationMinutes"
			:label="$t('leisure.fields.durationMinutes')"
			:min="1"
			:max="100000"
			:step="15"
		/>
		<VCheckbox
			v-model="model.isOneTime"
			:label="$t('leisure.fields.isOneTime')"
			hideDetails
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { ActivityBacklogProfileRequest } from '@/dtos/request/leisure/ActivityBacklogProfileRequest.ts'
	import { LocationType } from '@/dtos/enum/LocationType.ts'
	import { WeatherDependency } from '@/dtos/enum/WeatherDependency.ts'
	import { EnergyLevel } from '@/dtos/enum/EnergyLevel.ts'
	import { EffortType } from '@/dtos/enum/EffortType.ts'
	import { ExpectedCostTier } from '@/dtos/enum/ExpectedCostTier.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivitySelectOptions } from '@/composables/activity/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityBacklogProfileRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { fetchActivitySelectOptions } = useActivitySelectOptions()

	const form = ref<InstanceType<typeof VForm>>()
	const activityOptions = ref<SelectOption[]>([])

	const locationOptions = getEnumSelectOptions(LocationType, 'enums.locationType')
	const weatherOptions = getEnumSelectOptions(WeatherDependency, 'enums.weatherDependency')
	const energyOptions = getEnumSelectOptions(EnergyLevel, 'enums.energyLevel')
	const effortOptions = getEnumSelectOptions(EffortType, 'enums.effortType')
	const costOptions = getEnumSelectOptions(ExpectedCostTier, 'enums.expectedCostTier')

	onMounted(async () => {
		activityOptions.value = await fetchActivitySelectOptions()
	})

	async function validate() {
		return form.value!.validate()
	}

	function reset() {
		form.value?.reset()
	}

	defineExpose({ validate, reset })
</script>
