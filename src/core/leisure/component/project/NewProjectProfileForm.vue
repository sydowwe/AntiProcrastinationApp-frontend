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
		<VSelect
			v-model="model.difficultyLevel"
			:label="$t('leisure.fields.difficultyLevel')"
			:items="difficultyOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
		/>
		<VSelect
			v-model="model.readinessStatus"
			:label="$t('leisure.fields.readinessStatus')"
			:items="readinessOptions"
			itemValue="value"
			itemTitle="title"
			variant="outlined"
			density="comfortable"
		/>
		<VTextField
			v-model="model.projectArea"
			:label="$t('leisure.fields.projectArea')"
			required
			:rules="[requiredRule]"
			:errorMessages="serverErrors.projectArea"
		/>
		<VNumberInput
			v-model="model.estimatedHours"
			:label="$t('leisure.fields.estimatedHours')"
			:min="0"
			:step="0.5"
			:precision="null"
		/>
		<VCheckbox
			v-model="model.isMessy"
			:label="$t('leisure.fields.isMessy')"
			hideDetails
		/>
		<StringListEditor
			v-model="model.materialsNeeded"
			:label="$t('leisure.fields.materialsNeeded')"
		/>
		<StringListEditor
			v-model="model.requiredTools"
			:label="$t('leisure.fields.requiredTools')"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { ActivityProjectProfileRequest } from '@/core/leisure/dto/request/ActivityProjectProfileRequest.ts'
	import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
	import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useServerFieldErrors } from '@/core/leisure/composable/useServerFieldErrors.ts'
	import ActivityAutocompleteWithCreate from '@/core/leisure/component/ActivityAutocompleteWithCreate.vue'
	import StringListEditor from '@/core/leisure/component/project/StringListEditor.vue'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityProjectProfileRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { serverErrors, clearServerErrors, applyServerError } = useServerFieldErrors(['activityId', 'projectArea'])

	const form = ref<InstanceType<typeof VForm>>()

	const difficultyOptions = getEnumSelectOptions(DifficultyLevel, 'enums.difficultyLevel')
	const readinessOptions = getEnumSelectOptions(ReadinessStatus, 'enums.readinessStatus')

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
