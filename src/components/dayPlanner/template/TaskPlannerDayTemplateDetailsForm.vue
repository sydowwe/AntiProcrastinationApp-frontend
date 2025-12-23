<template>
<VCard elevation="2">
	<VForm>
		<VCardTitle class="pt-3 px-5 d-flex justify-space-between align-center">
			<span>Template details</span>
			<VSwitch v-model="formData.isActive" color="primary" hideDetails density="comfortable"></VSwitch>
		</VCardTitle>
		<VCardText>
			<VRow class="custom-row" noGutters>
				<VCol cols="6" class="mb-3">
					<TimePicker
						v-model="formData.defaultWakeUpTime"
						label="Wake Up"
						allowedMinutesSelected="10"
					/>
				</VCol>
				<VCol cols="6" class="mb-3 text-right">
					<TimePicker
						v-model="formData.defaultBedTime"
						label="Bed Time"
						allowedMinutesSelected="10"
					/>
				</VCol>
				<VCol cols="12">
					<VTextField
						v-model="formData.name"
						label="Template Name"
						placeholder="Enter template name"
						outlined
						dense
					/>
				</VCol>


				<VCol cols="12">
					<VTextarea
						v-model="formData.description"
						label="Description"
						placeholder="Enter template description"
						outlined
						rows="3"
					/>
				</VCol>
				<VCol cols="12">
					<VSelect
						v-model="formData.suggestedForDayType"
						:items="dayTypeOptions"
						label="Suggested for Day Type"
						outlined
						dense
						clearable
					/>
				</VCol>
				<VCol cols="12">
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
				</VCol>
				<VCol cols="12">
					<VTextField
						v-model="formData.icon"
						label="Icon"
						placeholder="mdi-icon-name"
						outlined
						dense
					/>
				</VCol>
			</VRow>

			<VRow>
				<VCol cols="12">
					<VBtn
						block
						color="primary"
						@click="saveTemplate"
					>
						Save Template
					</VBtn>
				</VCol>
			</VRow>
		</VCardText>
	</VForm>
</VCard>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {DayType} from '@/dtos/enum/DayType.ts'
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import TimePicker from '@/components/general/dateTime/TimePicker.vue'

const formData = ref(new TaskPlannerDayTemplateRequest())

const dayTypeOptions = Object.values(DayType)

function saveTemplate(): void {
	console.log(formData.value)
	emit('savedTemplate', formData.value)
}

const emit = defineEmits<{
	savedTemplate: [formData: TaskPlannerDayTemplateRequest]
}>()
</script>

<style>
.custom-row .v-col {
	padding: 8px !important;
}
</style>