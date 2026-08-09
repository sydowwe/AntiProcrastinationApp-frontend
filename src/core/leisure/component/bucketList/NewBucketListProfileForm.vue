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
		<VIdSelect
			v-model="model.experienceTypeId"
			:label="$t('leisure.fields.experienceType')"
			:items="experienceTypeOptions"
		/>
		<ComfortZoneStepper
			v-model="model.comfortZoneStep"
			:label="$t('leisure.fields.comfortZoneStep')"
		/>
		<VCheckbox
			v-model="model.requiresTravel"
			:label="$t('leisure.fields.requiresTravel')"
			hideDetails
		/>
		<VNumberInput
			v-model="model.financialGoal as number | null"
			:label="$t('leisure.fields.financialGoal')"
			:min="0"
			clearable
		/>
		<VTextField
			v-model="model.inspirationSource"
			:label="$t('leisure.fields.inspirationSource')"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { ActivityBucketListProfileRequest } from '@/core/leisure/dto/request/ActivityBucketListProfileRequest.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import ComfortZoneStepper from '@/core/leisure/component/bucketList/ComfortZoneStepper.vue'
	import { useActivityExperienceTypeApi } from '@/core/leisure/api/activityLookupApi.ts'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityBucketListProfileRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { fetchActivitySelectOptions } = useActivitySelectOptions()
	const { fetchAll: fetchExperienceTypes } = useActivityExperienceTypeApi()

	const form = ref<InstanceType<typeof VForm>>()
	const activityOptions = ref<SelectOption[]>([])
	const experienceTypeOptions = ref<LookupResponse[]>([])

	onMounted(async () => {
		;[activityOptions.value, experienceTypeOptions.value] = await Promise.all([
			fetchActivitySelectOptions(),
			fetchExperienceTypes(),
		])
	})

	async function validate() {
		return form.value!.validate()
	}

	function reset() {
		form.value?.reset()
	}

	defineExpose({ validate, reset })
</script>
