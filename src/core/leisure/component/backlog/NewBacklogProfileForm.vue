<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent="validate"
	>
		<ActivityAutocompleteWithCreate
			v-model="model.activityId"
			:label="$t('leisure.fields.activity')"
			:disabled="lockActivity"
			:errorMessages="serverErrors.activityId"
		/>
		<VIdSelect
			v-model="model.locationTypeId"
			:label="$t('leisure.fields.locationType')"
			:items="locationTypeOptions"
			required
			:rules="[requiredRule]"
			:errorMessages="serverErrors.locationTypeId"
		/>
		<VIdSelect
			v-model="model.weatherDependencyId"
			:label="$t('leisure.fields.weatherDependency')"
			:items="weatherDependencyOptions"
			required
			:rules="[requiredRule]"
			:errorMessages="serverErrors.weatherDependencyId"
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
		<VIdSelect
			v-model="model.expectedCostTierId"
			:label="$t('leisure.fields.expectedCostTier')"
			:items="expectedCostTierOptions"
			required
			:rules="[requiredRule]"
			:errorMessages="serverErrors.expectedCostTierId"
		/>
		<div class="d-flex flex-column flex-sm-row ga-3">
			<VNumberInput
				v-model="model.minParticipants"
				:label="$t('leisure.fields.minParticipants')"
				:min="1"
				:max="999"
				class="flex-1-1"
			/>
			<VNumberInput
				v-model="model.maxParticipants"
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
			v-model="model.isRepeatable"
			:label="$t('leisure.fields.isRepeatable')"
			hideDetails
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { ActivityBacklogProfileRequest } from '@/core/leisure/dto/request/ActivityBacklogProfileRequest.ts'
	import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
	import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useServerFieldErrors } from '@/core/leisure/composable/useServerFieldErrors.ts'
	import ActivityAutocompleteWithCreate from '@/core/leisure/component/ActivityAutocompleteWithCreate.vue'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import {
		useActivityLocationTypeApi,
		useActivityWeatherDependencyApi,
		useActivityExpectedCostTierApi,
	} from '@/core/leisure/api/activityLookupApi.ts'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityBacklogProfileRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { serverErrors, clearServerErrors, applyServerError } = useServerFieldErrors([
		'activityId',
		'locationTypeId',
		'weatherDependencyId',
		'expectedCostTierId',
	])

	const { fetchAll: fetchLocationTypes } = useActivityLocationTypeApi()
	const { fetchAll: fetchWeatherDependencies } = useActivityWeatherDependencyApi()
	const { fetchAll: fetchExpectedCostTiers } = useActivityExpectedCostTierApi()

	const form = ref<InstanceType<typeof VForm>>()
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

	// A server message is about the value that was submitted; any edit makes it stale.
	watch(model, clearServerErrors, { deep: true })

	async function validate() {
		clearServerErrors()
		return form.value!.validate()
	}

	function reset() {
		clearServerErrors()
		form.value?.reset()
	}

	defineExpose({ validate, reset, applyServerError })
</script>
