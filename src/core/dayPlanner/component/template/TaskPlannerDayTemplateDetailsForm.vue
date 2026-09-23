<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-8"
	>
		<VTextField
			v-model="formData.name"
			:label="$t('planner.template.templateNameLabel')"
			:placeholder="$t('planner.template.templateNamePlaceholder')"
			:rules="[requiredRule]"
			:maxlength="NAME_MAX_LENGTH"
			hideDetails="auto"
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
			:maxlength="DESCRIPTION_MAX_LENGTH"
			hideDetails
		/>
		<div class="d-flex flex-column flex-md-row ga-4">
			<VSelect
				v-model="formData.suggestedForDayType"
				:items="dayTypeOptions"
				:label="$t('planner.template.suggestedDayTypeLabel')"
				:rules="[requiredRule]"
				hideDetails="auto"
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
				<!-- Seven buttons do not fit the side panel, and the card clipped the rest (F57) — see the
				     style block for why wrapping alone is not enough. The dialog needs it too: beside the
				     icon field, Sunday was clipped off the dialog's edge at 1440 px. -->
				<DayOfWeekPicker
					v-model="formData.scheduledDays"
					class="wrapping-day-picker"
				/>
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
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'

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
	const { requiredRule } = useGeneralRules()

	// The server's `[StringLength]` limits (`TaskPlannerDayTemplateRequest.cs`). A native `maxlength`
	// rather than a rule: the framework has no length rule, and a cap cannot be failed. The icon's
	// 50 is not mirrored — it comes from the picker's list, never typed.
	const NAME_MAX_LENGTH = 100
	const DESCRIPTION_MAX_LENGTH = 500

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
		// `validate()` resolves to `{ valid, errors }` — an object, so testing it for truthiness passed
		// every form, rules or not.
		const result = await form.value?.validate()
		if (!result?.valid) {
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
	/* The toggle has a fixed height and its buttons fill it, so a wrapped second row squeezed both
	   rows into one row's height. Free the group and hold each button at the compact row height —
	   `min-height`, because the group sets the buttons' `height: auto` inline. */
	.wrapping-day-picker {
		flex-wrap: wrap;
		height: auto;
	}

	.wrapping-day-picker :deep(.v-btn) {
		min-height: 36px;
	}
	.details-form {
		@media (min-width: 1280px) {
			min-width: 400px;
		}
	}
</style>
