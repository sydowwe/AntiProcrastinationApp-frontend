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
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import ActivityAutocompleteWithCreate from '@/core/leisure/component/ActivityAutocompleteWithCreate.vue'
	import ComfortZoneStepper from '@/core/leisure/component/bucketList/ComfortZoneStepper.vue'
	import { useActivityExperienceTypeApi } from '@/core/leisure/api/activityLookupApi.ts'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityBucketListProfileRequest>({ required: true })

	const { fetchAll: fetchExperienceTypes } = useActivityExperienceTypeApi()

	const form = ref<InstanceType<typeof VForm>>()
	const experienceTypeOptions = ref<LookupResponse[]>([])

	onMounted(async () => {
		experienceTypeOptions.value = await fetchExperienceTypes()
	})

	async function validate() {
		return form.value!.validate()
	}

	function reset() {
		form.value?.reset()
	}

	defineExpose({ validate, reset })
</script>
