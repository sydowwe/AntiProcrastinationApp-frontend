<template>
	<MyDialog
		v-model="model"
		:title="$t('planner.calendar.dayDetailsTitle')"
		maxWidth="600px"
		@confirmed="save"
	>
		<VForm
			ref="form"
			class="pt-2"
			validateOn="submit"
			@submit="save"
		>
			<div class="d-flex flex-column ga-4">
				<!-- Wake-up and Bed Time -->
				<div class="d-flex justify-center">
					<TimeRangePicker
						v-model:start="data.wakeUpTime"
						v-model:end="data.bedTime"
						startIcon="sun"
						endIcon="moon"
					/>
				</div>

				<!-- Label -->
				<VTextField
					v-model="data.label"
					:label="$t('planner.calendar.dayLabelLabel')"
					prependIcon="tag"
					:placeholder="$t('planner.calendar.dayLabelPlaceholder')"
					clearable
					hideDetails
				/>

				<!-- Day Type, Location & Weather -->
				<div class="d-flex ga-4 flex-wrap">
					<VSelect
						v-model="data.dayType"
						:label="$t('planner.calendar.dayTypeLabel')"
						:items="dayTypeOptions"
						prependIcon="calendar-day"
						maxWidth="200px"
						hideDetails
					/>
					<VSelect
						v-model="data.location"
						:label="$t('planner.calendar.locationLabel')"
						:items="locationOptions"
						prependIcon="location-dot"
						clearable
						hideDetails
					/>
				</div>
				<VTextField
					v-model="data.weather"
					:label="$t('planner.calendar.weatherLabel')"
					prependIcon="cloud-sun"
					:placeholder="$t('planner.calendar.weatherPlaceholder')"
					clearable
					hideDetails
				/>
				<!-- Notes -->
				<VTextarea
					v-model="data.notes"
					:label="$t('planner.calendar.notesLabel')"
					prependIcon="note-sticky"
					rows="4"
					autoGrow
					:placeholder="$t('planner.calendar.notesPlaceholder')"
				/>
			</div>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import type { VForm } from 'vuetify/components'
	import { CalendarRequest } from '@/core/dayPlanner/dto/request/CalendarRequest.ts'
	import { DayType } from '@/_common/dto/enum/DayType.ts'
	import { Location } from '@/core/dayPlanner/dto/enum/Location.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useI18n } from 'vue-i18n'

	const props = defineProps<{
		calendar?: Calendar
	}>()
	const emit = defineEmits<{
		updated: [updatedEntity: Calendar]
	}>()
	const model = defineModel<boolean>({ required: true })
	const { updateWithResponse } = useCalendarQuery()
	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()

	const form = ref<InstanceType<typeof VForm>>()
	const data = ref<CalendarRequest>(new CalendarRequest())

	const locationOptions = Object.values(Location).map(v => ({ title: t(`planner.location.${v}`), value: v }))
	const overrideDayTypes = [DayType.Vacation, DayType.SickDay, DayType.Special]

	function getNaturalDayType(): DayType {
		// dayIndex 6 or 7 = weekend (Saturday/Sunday)
		if (props.calendar!.dayIndex === 6 || props.calendar!.dayIndex === 7) {
			return DayType.Weekend
		}
		return DayType.Workday
	}

	const dayTypeOptions = computed(() => {
		const naturalType = getNaturalDayType()
		// Show natural type + override types (Vacation, SickDay, Special)
		return [naturalType, ...overrideDayTypes].map(v => ({ title: t(`planner.dayType.${v}`), value: v }))
	})

	// Watch for calendar changes to populate form
	watch(
		() => props.calendar,
		calendar => {
			if (calendar) {
				data.value = CalendarRequest.fromResponse(calendar)
			}
		},
		{ immediate: true },
	)

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid || !props.calendar!.id) {
			return
		}
		await updateWithResponse(props.calendar!.id, data.value)
			.then(updatedEntity => {
				emit('updated', updatedEntity)
				model.value = false
			})
			.catch(() => {
				showErrorSnackbar(t('planner.feedback.calendarUpdateFailed'))
			})
	}
</script>
