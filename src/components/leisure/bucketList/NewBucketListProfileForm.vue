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
			v-model="model.experienceType"
			:label="$t('leisure.fields.experienceType')"
			:items="experienceOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
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
	import type { ActivityBucketListProfileRequest } from '@/dtos/request/leisure/ActivityBucketListProfileRequest.ts'
	import { ExperienceType } from '@/dtos/enum/ExperienceType.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivitySelectOptions } from '@/composables/activity/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'
	import ComfortZoneStepper from '@/components/leisure/bucketList/ComfortZoneStepper.vue'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityBucketListProfileRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { fetchActivitySelectOptions } = useActivitySelectOptions()

	const form = ref<InstanceType<typeof VForm>>()
	const activityOptions = ref<SelectOption[]>([])

	const experienceOptions = getEnumSelectOptions(ExperienceType, 'enums.experienceType')

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
