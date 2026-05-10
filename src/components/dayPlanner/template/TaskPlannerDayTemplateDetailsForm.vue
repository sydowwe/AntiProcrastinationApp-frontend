<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-8"
	>
		<VTextField
			v-model="formData.name"
			label="Template Name"
			placeholder="Enter template name"
			hideDetails
		/>

		<div class="mx-auto d-flex ga-8 ga-xl-4 flex-xl-row">
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
		<div class="d-flex flex-column flex-md-row ga-4">
			<VSelect
				v-model="formData.suggestedForDayType"
				:items="dayTypeOptions"
				label="Suggested for Day Type"
				hideDetails
			/>
			<VSelect
				v-model="formData.suggestedLocation"
				:items="locationOptions"
				label="Suggested Location"
				clearable
				hideDetails
			/>
		</div>
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
		<div
			class="d-flex ga-4"
			:class="isDialog ? 'flex-column flex-md-row align-center align-md-end' : 'flex-column'"
		>
			<IconPicker
				class="flex-fill"
				:class="{ 'w-100': !isDialog }"
				v-model="formData.icon"
				label="Icon"
			/>
			<div>
				<label class="text-caption text-medium-emphasis mb-1 d-block">Scheduled Days</label>
				<VBtnToggle
					v-model="formData.scheduledDays"
					multiple
					density="compact"
					color="secondaryOutline"
					variant="tonal"
					divided
				>
					<VBtn
						v-for="day in dayOfWeekOptions"
						:key="day.value"
						:value="day.value"
						size="small"
					>
						{{ day.label }}
					</VBtn>
				</VBtnToggle>
			</div>
		</div>
	</VForm>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { dayTypeOptions } from '@/dtos/enum/DayType.ts'
	import { DayOfWeek, dayOfWeekOptions } from '@/dtos/enum/DayOfWeek.ts'
	import { locationOptions } from '@/dtos/enum/Location.ts'
	import { TaskPlannerDayTemplateRequest } from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import IconPicker from '@/components/general/inputs/IconPicker.vue'
	import type { VForm } from 'vuetify/components'

	const {
		template,
		defaultValues,
		isDialog = false,
	} = defineProps<{
		template: TaskPlannerDayTemplate | null
		defaultValues?: TaskPlannerDayTemplateRequest | null
		isDialog?: boolean
	}>()

	const form = ref<InstanceType<typeof VForm>>()
	const formData = ref(new TaskPlannerDayTemplateRequest())

	// Populate form when template prop changes
	watch(
		() => template,
		newTemplate => {
			if (newTemplate) {
				formData.value = TaskPlannerDayTemplateRequest.fromEntity(newTemplate)
			} else if (defaultValues) {
				formData.value = { ...defaultValues }
			} else {
				formData.value = new TaskPlannerDayTemplateRequest()
			}
		},
		{ immediate: true },
	)

	// Also watch defaultValues for duplicate flow
	watch(
		() => defaultValues,
		newDefaults => {
			if (newDefaults && !template) {
				formData.value = { ...newDefaults }
			}
		},
	)

	const dayOfWeekOrder = Object.values(DayOfWeek)

	async function validateAndGetData() {
		if (!(await form.value?.validate())) {
			return false
		}
		formData.value.scheduledDays = [...formData.value.scheduledDays].sort(
			(a, b) => dayOfWeekOrder.indexOf(a) - dayOfWeekOrder.indexOf(b),
		)
		return formData.value
	}

	defineExpose({
		validateAndGetData,
	})
</script>

<style scoped>
	.details-form {
		@media (min-width: 1280px) {
			min-width: 400px;
		}
	}
</style>
