<template>
<VCard v-if="!isHidden" class="d-flex flex-column details-form" elevation="2">
	<VCardTitle class="pt-5 px-5 pb-0 d-flex justify-space-between align-center">
		<span class="text-grey-lighten-1">Template details</span>
		<VIconBtn
			color="secondaryOutline"
			icon="xmark"
			@click="isHidden = !isHidden"
			variant="tonal"
			size="40"
		>
			<VIcon size="24"></VIcon>
		</VIconBtn>
	</VCardTitle>
	<VCardText class="flex-fill">
		<VForm class="py-6 d-flex flex-column ga-4">
			<div class="mb-5 d-flex flex-column flex-xl-row justify-space-between">
				<TimePicker
					v-model="formData.defaultWakeUpTime"
					label="Wake Up"
					icon="alarm-clock"
					allowedMinutesSelected="10"
				/>
				<TimePicker
					v-model="formData.defaultBedTime"
					label="Bed Time"
					icon="bed"
					allowedMinutesSelected="10"
				/>
			</div>
			<VTextField
				v-model="formData.name"
				label="Template Name"
				placeholder="Enter template name"
			/>


			<VTextarea
				v-model="formData.description"

				label="Description"
				placeholder="Enter template description"
				rows="3"
			/>
			<VSelect
				v-model="formData.suggestedForDayType"

				:items="dayTypeOptions"
				label="Suggested for Day Type"
			/>
			<VCombobox
				v-model="formData.tags"

				label="Tags"
				placeholder="Add tags"
				:singleLine="false"
				chips
				multiple
				closableChips
			/>
			<div class="d-flex ga-4 justify-space-between align-center">
				<VTextField
					v-model="formData.icon"
					label="Icon"
					hideDetails
				/>
				<VSwitch label="Active" v-model="formData.isActive" color="primary" hideDetails density="comfortable"></VSwitch>
			</div>
		</VForm>
	</VCardText>
	<VCardActions class="pa-5">
		<VBtn
			block
			color="primary"
			@click="updateDetails"
		>
			Update details
		</VBtn>
	</VCardActions>
</VCard>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {DayType} from '@/dtos/enum/DayType.ts'
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import TimePicker from '@/components/general/dateTime/TimePicker.vue'

const props = defineProps<{
	template: TaskPlannerDayTemplate | null
}>()

const isHidden = defineModel<boolean>({required: true})
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

function updateDetails(): void {
	emit('updateDetails', formData.value)
}

const emit = defineEmits<{
	updateDetails: [formData: TaskPlannerDayTemplateRequest]
}>()
</script>

<style scoped>
.details-form {
	@media (min-width: 1280px) {
		min-width: 400px;
	}
}
</style>