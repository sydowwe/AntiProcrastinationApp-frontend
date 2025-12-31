<template>
<VCard elevation="2">
	<VCardTitle class="pt-3 px-5 d-flex justify-space-between align-center">
		<span>Template details</span>
	</VCardTitle>
	<VCardText>
		<VForm>
			<div class="d-flex flex-column ga-4">
				<div class="mb-3 d-flex flex-column flex-sm-row justify-space-between">
					<div class="d-flex flex-column flex-md-row ga-4 align-md-center">
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
					<VSwitch label="Active" v-model="formData.isActive" color="primary" hideDetails density="comfortable"></VSwitch>
				</div>
				<VTextField
					v-model="formData.name"
					label="Template Name"
					placeholder="Enter template name"
					outlined
					dense
				/>


				<VTextarea
					v-model="formData.description"

					label="Description"
					placeholder="Enter template description"
					outlined
					rows="3"
				/>
				<VSelect
					v-model="formData.suggestedForDayType"

					:items="dayTypeOptions"
					label="Suggested for Day Type"
					outlined
					dense
					clearable
				/>
				<VCombobox
					v-model="formData.tags"

					label="Tags"
					placeholder="Add tags"
					:singleLine="false"
					outlined
					dense
					chips
					multiple
					closableChips
				/>
				<VTextField
					v-model="formData.icon"

					label="Icon"
					outlined
					dense
				/>
				<VBtn
					block
					color="primary"
					@click="saveTemplate"
				>
					Save Template
				</VBtn>
			</div>
		</VForm>
	</VCardText>
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

function saveTemplate(): void {
	console.log(formData.value)
	emit('savedTemplate', formData.value)
}

const emit = defineEmits<{
	savedTemplate: [formData: TaskPlannerDayTemplateRequest]
}>()
</script>

<style>
</style>