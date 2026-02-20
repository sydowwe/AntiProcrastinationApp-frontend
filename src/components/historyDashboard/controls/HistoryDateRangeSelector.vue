<template>
<div class="d-flex align-center ga-4 flex-wrap">
	<VBtnToggle
		v-model="preset"
		mandatory
		variant="outlined"
		color="secondaryOutline"
		style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 48px"
	>
		<VBtn :value="DateRangePreset.ThisYear" height="48px">This year</VBtn>
		<VBtn :value="DateRangePreset.ThisMonth" height="48px">This month</VBtn>
		<VBtn :value="DateRangePreset.Last30Days" height="48px">30 days</VBtn>
		<VBtn :value="DateRangePreset.Last7Days" height="48px">7 days</VBtn>
		<VBtn :value="DateRangePreset.OneDay" height="48px">1 Day</VBtn>
		<VBtn :value="DateRangePreset.Range" height="48px">Custom range</VBtn>
	</VBtnToggle>

	<!-- 1 Day: single date + two time pickers -->
	<template v-if="preset === DateRangePreset.OneDay">
		<VDateInput
			v-model="oneDayDate"
			label="Date"
			hideDetails
			:max="today"
			density="comfortable"
			style="min-width: 180px; max-width: 180px"
		/>
		<TimePickerTextField
			v-model="oneDayTimeFrom"
			label="From"
			density="comfortable"
			hide-details
		/>
		<TimePickerTextField
			v-model="oneDayTimeTo"
			label="To"
			density="comfortable"
			hide-details
		/>
	</template>

	<!-- Range: two datetime pickers -->
	<template v-if="preset === DateRangePreset.Range">
		<DateTimePicker
			v-model="rangeFrom"
			label="From"
			:maxDate="rangeTo ?? today"
			:dateClearable="false"
			density="comfortable"
		/>
		<DateTimePicker
			v-model="rangeTo"
			label="To"
			:minDate="rangeFrom"
			:maxDate="today"
			:dateClearable="false"
			density="comfortable"
		/>
	</template>
</div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {VDateInput} from 'vuetify/labs/components'
import {DateRangePreset} from '@/components/historyDashboard/types/DateRangePreset.ts'
import TimePickerTextField from '@/components/general/dateTime/TimePickerTextField.vue'
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue'
import {Time} from '@/utils/Time.ts'

const dateFrom = defineModel<string>('dateFrom', {required: true})
const dateTo = defineModel<string>('dateTo', {required: true})

const today = new Date()
const preset = ref<DateRangePreset>(DateRangePreset.Last7Days)

// --- 1 Day state ---
const oneDayDate = ref<Date>(new Date())
const oneDayTimeFrom = ref(new Time(0, 0))
const oneDayTimeTo = ref(new Time(23, 59))

// --- Range state ---
const rangeFrom = ref<Date | undefined>(daysAgo(7))
const rangeTo = ref<Date | undefined>(new Date())

function daysAgo(n: number): Date {
	const d = new Date()
	d.setDate(d.getDate() - n)
	return d
}

function startOfMonth(): Date {
	const d = new Date()
	d.setDate(1)
	return d
}

function startOfYear(): Date {
	return new Date(new Date().getFullYear(), 0, 1)
}

function formatDate(d: Date): string {
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function formatDateTime(d: Date): string {
	const date = formatDate(d)
	const hours = String(d.getHours()).padStart(2, '0')
	const minutes = String(d.getMinutes()).padStart(2, '0')
	return `${date}T${hours}:${minutes}:00`
}

function emitValues() {
	switch (preset.value) {
		case DateRangePreset.Last7Days:
			dateFrom.value = formatDate(daysAgo(7))
			dateTo.value = formatDate(today)
			break
		case DateRangePreset.Last30Days:
			dateFrom.value = formatDate(daysAgo(30))
			dateTo.value = formatDate(today)
			break
		case DateRangePreset.ThisMonth:
			dateFrom.value = formatDate(startOfMonth())
			dateTo.value = formatDate(today)
			break
		case DateRangePreset.ThisYear:
			dateFrom.value = formatDate(startOfYear())
			dateTo.value = formatDate(today)
			break
		case DateRangePreset.OneDay: {
			const d = oneDayDate.value
			const from = new Date(d)
			from.setHours(oneDayTimeFrom.value.hours, oneDayTimeFrom.value.minutes, 0, 0)
			const to = new Date(d)
			to.setHours(oneDayTimeTo.value.hours, oneDayTimeTo.value.minutes, 0, 0)
			dateFrom.value = formatDateTime(from)
			dateTo.value = formatDateTime(to)
			break
		}
		case DateRangePreset.Range: {
			if (rangeFrom.value) dateFrom.value = formatDateTime(rangeFrom.value)
			if (rangeTo.value) dateTo.value = formatDateTime(rangeTo.value)
			break
		}
	}
}

watch(preset, () => emitValues(), {immediate: true})
watch([oneDayDate, oneDayTimeFrom, oneDayTimeTo], () => {
	if (preset.value === DateRangePreset.OneDay) emitValues()
}, {deep: true})
watch([rangeFrom, rangeTo], () => {
	if (preset.value === DateRangePreset.Range) emitValues()
}, {deep: true})
</script>
