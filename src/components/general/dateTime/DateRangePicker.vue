<template>
<div class="d-flex align-center ga-3 flex-wrap">
	<VSelect
		v-model="selectedMode"
		label="Mode"
		:items="modeOptions"
		itemTitle="label"
		hideDetails
		:density
		width="130px"
		max-width="130px"
	/>

	<!-- Range Mode -->
	<div v-if="selectedMode === 'range'" class="d-flex ga-3 flex-wrap">
		<VDateInput
			v-model="rangeStart"
			label="Start Date"
			:max="rangeEndMaxDate"
			:density
			hideDetails
			style="min-width: 190px"
		/>
		<VDateInput
			v-model="rangeEnd"
			label="End Date"
			:min="rangeStart"
			:max="rangeEndMaxDate"
			:density
			hideDetails
			style="min-width: 190px"
		/>
	</div>

	<!-- Month Mode -->
	<div v-else-if="selectedMode === 'month'" class="d-flex ga-2 flex-wrap align-center">
		<VBtn
			icon="fa-solid fa-chevron-left"
			:density
			variant="text"
			@click="previousMonth"
		/>
		<VAutocomplete
			v-model="selectedMonthValue"
			label="Month"
			:items="monthOptions"
			itemTitle="label"
			:density
			hideDetails
			maxWidth="145px"
			minWidth="145px"
		/>
		<VAutocomplete
			v-model="selectedYearValue"
			label="Year"
			:items="yearOptions"
			:density
			hideDetails
			maxWidth="110px"
			minWidth="110px"
		/>
		<VBtn
			icon="fa-solid fa-chevron-right"
			:density
			variant="text"
			@click="nextMonth"
		/>
	</div>

	<!-- Duration Mode -->
	<div v-else-if="selectedMode === 'duration'" class="d-flex align-center ga-3 flex-wrap">
		<VSelect
			v-model="durationAnchor"
			label="Anchor"
			:items="anchorOptions"
			itemTitle="label"
			hideDetails
			:density
			style="min-width: 140px"
		/>
		<VDateInput
			v-model="durationAnchorDate"
			:label="durationAnchor === 'start' ? 'Start Date' : 'End Date'"
			hideDetails
			:density
			style="min-width: 190px"
		/>

		<VSelect
			v-model="durationUnit"
			label="Unit"
			:items="unitOptions"
			itemTitle="label"
			hideDetails
			:density
			style="min-width: 120px"
		/>
		<VNumberInput
			v-model="durationQuantity"
			label="Quantity"
			:min="1"
			:max="maxQuantity"
			hideDetails
			:density
			style="min-width: 120px"
		/>
	</div>
</div>
<!-- Validation Error -->
<VAlert v-if="validationError" type="error" :density class="mt-2">
	{{ validationError }}
</VAlert>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {VDateInput} from 'vuetify/labs/components'

const dateRange = defineModel<{ start: Date | null; end: Date | null }>({default: () => ({start: null, end: null})})

const props = withDefaults(defineProps<{
	mode?: 'range' | 'month' | 'duration'
	hideDetails?: boolean
	density?: 'compact' | 'comfortable' | 'default'
}>(), {
	density: 'comfortable'
})


// Mode state
const selectedMode = ref<'range' | 'month' | 'duration'>(props.mode || 'range')

// Range mode state
const rangeStart = ref<Date | null>(dateRange.value.start || null)
const rangeEnd = ref<Date | null>(dateRange.value.end || null)

// Month mode state
const selectedMonthValue = ref<number | null>(new Date().getMonth())
const selectedYearValue = ref<number | null>(new Date().getFullYear())

// Duration mode state
const durationAnchorDate = ref<Date | null>(new Date())
const durationAnchor = ref<'start' | 'end'>('start')
const durationUnit = ref<'day' | 'week'>('week')
const durationQuantity = ref<number>(1)

// Select options
const modeOptions = [
	{label: 'Range', value: 'range'},
	{label: 'Month', value: 'month'},
	{label: 'Duration', value: 'duration'}
]

const anchorOptions = [
	{label: 'From Start', value: 'start'},
	{label: 'To End', value: 'end'}
]

const unitOptions = [
	{label: 'Days', value: 'day'},
	{label: 'Weeks', value: 'week'}
]

const monthOptions = [
	{label: 'January', value: 0},
	{label: 'February', value: 1},
	{label: 'March', value: 2},
	{label: 'April', value: 3},
	{label: 'May', value: 4},
	{label: 'June', value: 5},
	{label: 'July', value: 6},
	{label: 'August', value: 7},
	{label: 'September', value: 8},
	{label: 'October', value: 9},
	{label: 'November', value: 10},
	{label: 'December', value: 11}
]

const yearOptions = computed(() => {
	const currentYear = new Date().getFullYear()
	const years = []
	for (let i = currentYear - 10; i <= currentYear + 10; i++) {
		years.push(i)
	}
	return years
})

// Max quantity based on unit to cap at 31 days
const maxQuantity = computed(() => {
	if (durationUnit.value === 'day') return 31
	// week
	return 4
})

// Ensure quantity doesn't exceed max
watch([durationUnit, maxQuantity], () => {
	if (durationQuantity.value > maxQuantity.value) {
		durationQuantity.value = maxQuantity.value
	}
})

// Month navigation functions
function previousMonth() {
	if (selectedMonthValue.value === null || selectedYearValue.value === null) return

	if (selectedMonthValue.value === 0) {
		selectedMonthValue.value = 11
		selectedYearValue.value--
	} else {
		selectedMonthValue.value--
	}
}

function nextMonth() {
	if (selectedMonthValue.value === null || selectedYearValue.value === null) return

	if (selectedMonthValue.value === 11) {
		selectedMonthValue.value = 0
		selectedYearValue.value++
	} else {
		selectedMonthValue.value++
	}
}

// Computed dates
const computedStartDate = computed<Date | null>(() => {
	if (selectedMode.value === 'range') {
		return rangeStart.value
	} else if (selectedMode.value === 'month') {
		// Month mode - first day of selected month
		if (selectedMonthValue.value === null || selectedYearValue.value === null) return null
		return new Date(selectedYearValue.value, selectedMonthValue.value, 1)
	} else {
		// Duration mode
		if (!durationAnchorDate.value) return null

		const anchor = new Date(durationAnchorDate.value)

		if (durationAnchor.value === 'start') {
			return anchor
		} else {
			// Calculate start from end date
			const days = calculateDays()
			const start = new Date(anchor)
			start.setDate(start.getDate() - days)
			return start
		}
	}
})

const computedEndDate = computed<Date | null>(() => {
	if (selectedMode.value === 'range') {
		return rangeEnd.value
	} else if (selectedMode.value === 'month') {
		// Month mode - last day of selected month
		if (selectedMonthValue.value === null || selectedYearValue.value === null) return null
		return new Date(selectedYearValue.value, selectedMonthValue.value + 1, 0)
	} else {
		// Duration mode
		if (!durationAnchorDate.value) return null

		const anchor = new Date(durationAnchorDate.value)

		if (durationAnchor.value === 'end') {
			return anchor
		} else {
			// Calculate end from start date
			const days = calculateDays()
			const end = new Date(anchor)
			end.setDate(end.getDate() + days)
			return end
		}
	}
})

// Calculate days based on unit and quantity
function calculateDays(): number {
	if (durationUnit.value === 'day') {
		return durationQuantity.value
	} else {
		// week
		return durationQuantity.value * 7
	}
}

// Days difference calculation
const daysDifference = computed(() => {
	if (!computedStartDate.value || !computedEndDate.value) return 0
	const diff = computedEndDate.value.getTime() - computedStartDate.value.getTime()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

// Validation
const validationError = computed(() => {
	if (daysDifference.value > 31) {
		return 'Date range cannot exceed 31 days'
	}
	if (computedStartDate.value && computedEndDate.value && computedStartDate.value > computedEndDate.value) {
		return 'Start date must be before end date'
	}
	return null
})

// Max date for range end to prevent exceeding 31 days
const rangeEndMaxDate = computed(() => {
	if (!rangeStart.value) return undefined
	const maxDate = new Date(rangeStart.value)
	maxDate.setDate(maxDate.getDate() + 31)
	return maxDate
})

// Format date for display
function formatDate(date: Date | null): string {
	if (!date) return ''
	return date.toLocaleDateString('cs-CZ', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})
}

// Update model value
watch([computedStartDate, computedEndDate], () => {
	if (!validationError.value) {
		dateRange.value = {
			start: computedStartDate.value,
			end: computedEndDate.value
		}
	}
}, {immediate: true})

// Expose methods for parent component
defineExpose({
	getDateRange: () => ({
		start: computedStartDate.value,
		end: computedEndDate.value
	}),
	isValid: () => !validationError.value
})
</script>