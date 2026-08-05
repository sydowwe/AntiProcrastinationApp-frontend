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
		/>
		<VNumberInput
			v-model="model.estimatedHours"
			:label="$t('leisure.fields.estimatedHours')"
			:min="0"
			:step="0.5"
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
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { ActivityProjectProfileRequest } from '@/dtos/request/leisure/ActivityProjectProfileRequest.ts'
	import { DifficultyLevel } from '@/dtos/enum/DifficultyLevel.ts'
	import { ReadinessStatus } from '@/dtos/enum/ReadinessStatus.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivitySelectOptions } from '@/composables/activity/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import StringListEditor from '@/components/leisure/project/StringListEditor.vue'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<ActivityProjectProfileRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { fetchActivitySelectOptions } = useActivitySelectOptions()

	const form = ref<InstanceType<typeof VForm>>()
	const activityOptions = ref<SelectOption[]>([])

	const difficultyOptions = getEnumSelectOptions(DifficultyLevel, 'enums.difficultyLevel')
	const readinessOptions = getEnumSelectOptions(ReadinessStatus, 'enums.readinessStatus')

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
