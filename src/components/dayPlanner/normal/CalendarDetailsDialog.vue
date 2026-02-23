<template>
<MyDialog
	title="Day Details"
	v-model="model"
	@confirmed="save"
	maxWidth="600px"
>
	<VForm ref="form" @submit="save" validate-on="submit">
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
				label="Day Label"
				prependIcon="tag"
				placeholder="e.g., Project Deadline, Birthday..."
				clearable
				hideDetails
			/>

			<!-- Day Type & Weather -->
			<div class="d-flex ga-4">
				<VSelect
					v-model="data.dayType"
					label="Day Type"
					:items="dayTypeOptions"
					prependIcon="calendar-day"
					hideDetails
				/>
				<VTextField
					v-model="data.weather"
					label="Weather"
					prependIcon="cloud-sun"
					placeholder="e.g., Sunny, Rainy..."
					clearable
					hideDetails
				/>
			</div>

			<!-- Notes -->
			<VTextarea
				v-model="data.notes"
				label="Notes"
				prependIcon="note-sticky"
				rows="4"
				autoGrow
				placeholder="Add any notes about this day..."
			/>
		</div>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import type {VForm} from 'vuetify/components'
import {CalendarRequest} from '@/dtos/request/activityPlanning/CalendarRequest.ts'
import {DayType} from '@/dtos/enum/DayType.ts'
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import {useCalendarQuery} from '@/api/ConcretesCrudComposable.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {updateWithResponse} = useCalendarQuery()
const {showErrorSnackbar} = useSnackbar()

const props = defineProps<{
	calendar?: Calendar
}>()

const model = defineModel<boolean>({required: true})
const form = ref<InstanceType<typeof VForm>>()
const data = ref<CalendarRequest>(new CalendarRequest())

const overrideDayTypes = [DayType.Vacation, DayType.SickDay, DayType.Special]

function getNaturalDayType(): DayType {
	if (props.calendar!.holidayName) {
		return DayType.Holiday
	}
	// dayIndex 6 or 7 = weekend (Saturday/Sunday)
	if (props.calendar!.dayIndex === 6 || props.calendar!.dayIndex === 7) {
		return DayType.Weekend
	}
	return DayType.Workday
}

const dayTypeOptions = computed(() => {
	const naturalType = getNaturalDayType()
	// Show natural type + override types (Vacation, SickDay, Special)
	return [naturalType, ...overrideDayTypes]
})

// Watch for calendar changes to populate form
watch(() => props.calendar, (calendar) => {
	if (calendar) {
		data.value = CalendarRequest.fromResponse(calendar)
	}
}, {immediate: true})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid || !props.calendar!.id) {
		return
	}
	await updateWithResponse(props.calendar!.id, data.value).then(
		updatedEntity => {
			emit('updated', updatedEntity)
			model.value = false
		}).catch(() => {
		showErrorSnackbar('Failed to update calendar')
	})
}

const emit = defineEmits<{
	updated: [updatedEntity: Calendar]
}>()
</script>
