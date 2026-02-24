<template>
<div class="d-flex align-center ga-4 flex-wrap">
	<VBtnToggle
		v-model="selectedRangeType"
		mandatory
		variant="outlined"
		color="secondaryOutline"
		style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 48px"
	>
		<VBtn :value="ActivityDateRangeTypeEnum.ThisYear" height="48px">This year</VBtn>
		<VBtn :value="ActivityDateRangeTypeEnum.ThisMonth" height="48px">This month</VBtn>
		<VBtn :value="ActivityDateRangeTypeEnum.OneMonth" height="48px">30 days</VBtn>
		<VBtn :value="ActivityDateRangeTypeEnum.OneWeek" height="48px">7 days</VBtn>
		<VBtn :value="ActivityDateRangeTypeEnum.CustomRange" height="48px">Custom range</VBtn>
	</VBtnToggle>

	<template v-if="selectedRangeType === ActivityDateRangeTypeEnum.CustomRange">
		<VDateInput
			v-model="rangeFromDate"
			label="From"
			hideDetails
			:max="rangeToDate ?? today"
			density="comfortable"
			style="min-width: 180px; max-width: 180px"
		/>
		<VDateInput
			v-model="rangeToDate"
			label="To"
			hideDetails
			:min="rangeFromDate"
			:max="today"
			density="comfortable"
			style="min-width: 180px; max-width: 180px"
		/>
	</template>
</div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {VDateInput} from 'vuetify/labs/components'
import {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'

const date = defineModel<string>('date', {required: true})
const rangeType = defineModel<ActivityDateRangeTypeEnum>('rangeType', {required: true})
const endDate = defineModel<string | undefined>('endDate', {required: true})

const today = new Date()
const selectedRangeType = ref<ActivityDateRangeTypeEnum>(ActivityDateRangeTypeEnum.OneWeek)

// --- Custom Range state ---
const rangeFromDate = ref<Date | undefined>(daysAgo(7))
const rangeToDate = ref<Date | undefined>(new Date())

function daysAgo(n: number): Date {
	const d = new Date()
	d.setDate(d.getDate() - n)
	return d
}

function formatDate(d: Date): string {
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function emitValues() {
	const todayStr = formatDate(today)
	rangeType.value = selectedRangeType.value

	switch (selectedRangeType.value) {
		case ActivityDateRangeTypeEnum.OneWeek:
		case ActivityDateRangeTypeEnum.OneMonth:
		case ActivityDateRangeTypeEnum.ThisMonth:
		case ActivityDateRangeTypeEnum.ThisYear:
			date.value = todayStr
			endDate.value = undefined
			break
		case ActivityDateRangeTypeEnum.CustomRange:
			if (rangeFromDate.value) {
				date.value = formatDate(rangeFromDate.value)
			}
			if (rangeToDate.value) {
				endDate.value = formatDate(rangeToDate.value)
			}
			break
	}
}

watch(selectedRangeType, () => emitValues(), {immediate: true})
watch([rangeFromDate, rangeToDate], () => {
	if (selectedRangeType.value === ActivityDateRangeTypeEnum.CustomRange) emitValues()
}, {deep: true})
</script>
