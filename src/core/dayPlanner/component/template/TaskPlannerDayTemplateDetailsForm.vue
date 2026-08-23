<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-8"
	>
		<VTextField
			v-model="formData.name"
			:label="$t('planner.template.templateNameLabel')"
			:placeholder="$t('planner.template.templateNamePlaceholder')"
			hideDetails
		/>

		<div class="mx-auto d-flex ga-8 ga-xl-4 flex-xl-row">
			<TimePicker
				v-model="formData.defaultWakeUpTime"
				:label="$t('planner.template.wakeUpLabel')"
				icon="alarm-clock"
				allowedMinutesSelected="10"
				hideDetails
			/>
			<TimePicker
				v-model="formData.defaultBedTime"
				:label="$t('planner.template.bedTimeLabel')"
				icon="bed"
				allowedMinutesSelected="10"
				hideDetails
			/>
		</div>

		<VTextarea
			v-model="formData.description"
			:label="$t('planner.template.descriptionLabel')"
			:placeholder="$t('planner.template.descriptionPlaceholder')"
			rows="2"
			hideDetails
		/>
		<div class="d-flex flex-column flex-md-row ga-4">
			<VSelect
				v-model="formData.suggestedForDayType"
				:items="dayTypeOptions"
				:label="$t('planner.template.suggestedDayTypeLabel')"
				hideDetails
			/>
			<VSelect
				v-model="formData.suggestedLocation"
				:items="locationOptions"
				:label="$t('planner.template.suggestedLocationLabel')"
				clearable
				hideDetails
			/>
		</div>
		<VCombobox
			v-model="formData.tags"
			:label="$t('planner.template.tagsLabel')"
			:placeholder="$t('planner.template.tagsPlaceholder')"
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
				:label="$t('planner.template.iconLabel')"
			/>
			<div>
				<label class="text-caption text-medium-emphasis mb-1 d-block">
					{{ $t('planner.template.scheduledDaysLabel') }}
				</label>
				<DayOfWeekPicker v-model="formData.scheduledDays" />
			</div>
		</div>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { dayTypeOptions as dayTypeValues } from '@/core/dayPlanner/dto/enum/dayTypeOptions.ts'
	import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
	import { locationOptions as locationValues } from '@/core/dayPlanner/dto/enum/Location.ts'
	import { useI18n } from 'vue-i18n'
	import { TaskPlannerDayTemplateRequest } from '@/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import IconPicker from '@/_common/component/inputs/IconPicker.vue'
	import DayOfWeekPicker from '@/_common/component/inputs/DayOfWeekPicker.vue'
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

	const { t } = useI18n()
	const dayTypeOptions = computed(() => dayTypeValues.map(v => ({ title: t(`planner.dayType.${v}`), value: v })))
	const locationOptions = computed(() =>
		locationValues.map(o => ({ title: t(`planner.location.${o.value}`), value: o.value })),
	)

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
