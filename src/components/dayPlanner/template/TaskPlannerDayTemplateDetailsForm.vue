<template>
<VForm ref="form" class="d-flex flex-column ga-8">
	<VTextField
		v-model="formData.name"
		label="Template Name"
		placeholder="Enter template name"
		hideDetails
	/>

	<div class="d-flex flex-column ga-8 ga-xl-4 flex-xl-row">
		<TimePicker
			v-model="formData.defaultWakeUpTime"
			label="Wake Up"
			icon="alarm-clock"
			allowedMinutesSelected="10"
			hideDetails
		/>
		<TimePicker
			v-model="formData.defaultBedTime"
			label="Bed Time"
			icon="bed"
			allowedMinutesSelected="10"
			hideDetails
		/>
	</div>

	<VTextarea
		v-model="formData.description"
		label="Description"
		placeholder="Enter template description"
		rows="2"
		hideDetails
	/>
	<VSelect
		v-model="formData.suggestedForDayType"
		:items="dayTypeOptions"
		label="Suggested for Day Type"
		hideDetails
	/>
	<VCombobox
		v-model="formData.tags"
		label="Tags"
		placeholder="Add tags"
		:singleLine="false"
		chips
		multiple
		hideDetails
		clearable
		closableChips
	/>
	<div class="d-flex ga-4 justify-space-between align-center">
		<IconPicker label="Icon" v-model="formData.icon"/>
		<VSwitch label="Active" v-model="formData.isActive" color="primary" hideDetails density="comfortable"></VSwitch>
	</div>
</VForm>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {DayType} from '@/dtos/enum/DayType.ts'
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import TimePicker from '@/components/general/dateTime/TimePicker.vue'
import IconPicker from '@/components/general/inputs/IconPicker.vue';
import type {VForm} from 'vuetify/components';

const form = ref<InstanceType<typeof VForm>>()

const props = defineProps<{
	template: TaskPlannerDayTemplate | null
}>()

const formData = ref(new TaskPlannerDayTemplateRequest())

const dayTypeOptions = Object.values(DayType)

// Populate form when template prop changes
watch(() => props.template, (newTemplate) => {
	if (newTemplate) {
		formData.value = TaskPlannerDayTemplateRequest.fromEntity(newTemplate)
	} else {
		formData.value = new TaskPlannerDayTemplateRequest()
	}
}, {immediate: true})

async function validateAndGetData() {
	if (!await form.value?.validate()) {
		return false
	}
	return formData.value
}

defineExpose({
	validateAndGetData
})
</script>

<style scoped>
.details-form {
	@media (min-width: 1280px) {
		min-width: 400px;
	}
}
</style>