<template>
<div class="d-flex align-center ga-4 flex-wrap">
	<VSelect
		label="Range length"
		v-model="selectedRangeType"
		:items="rangeTypeItems"
		itemTitle="title"
		itemValue="value"
		variant="outlined"
		density="compact"
		hideDetails
		style="min-width: 140px; max-width: 140px"
	/>

	<MyDateInput
		v-model="dateFrom"
		label="From"
		hideDetails
		:max="dateTo ?? today"
		density="compact"
	/>
	<template v-if="selectedRangeType === ActivityDateRangeTypeEnum.CustomRange">
		<MyDateInput
			v-model="dateTo"
			label="To"
			hideDetails
			:min="dateFrom"
			:max="today"
			density="compact"
		/>
	</template>
</div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'
import MyDateInput from '@/components/general/dateTime/MyDateInput.vue';
import {useMoment} from '@/utils/momentHelper.ts';

const {formatToUsString} = useMoment()

const date = defineModel<string>('date', {required: true})
const rangeType = defineModel<ActivityDateRangeTypeEnum>('rangeType', {required: true})
const endDate = defineModel<string | undefined>('endDate', {required: true})

const today = new Date()
const selectedRangeType = ref<ActivityDateRangeTypeEnum>(ActivityDateRangeTypeEnum.Week)

const rangeTypeItems = [
	{title: '1 day', value: ActivityDateRangeTypeEnum.Day},
	{title: '3 days', value: ActivityDateRangeTypeEnum.ThreeDays},
	{title: '7 days', value: ActivityDateRangeTypeEnum.Week},
	{title: '2 weeks', value: ActivityDateRangeTypeEnum.TwoWeeks},
	{title: 'Month', value: ActivityDateRangeTypeEnum.Month},
	{title: '3 months', value: ActivityDateRangeTypeEnum.ThreeMonths},
	{title: 'Year', value: ActivityDateRangeTypeEnum.Year},
	{title: 'Custom range', value: ActivityDateRangeTypeEnum.CustomRange},
]

// --- Custom Range state ---
const dateFrom = ref<Date>(new Date())
const dateTo = ref<Date>(new Date())


function emitValues() {
	const todayStr = formatToUsString(dateFrom.value)
	rangeType.value = selectedRangeType.value

	console.log(todayStr)
	switch (selectedRangeType.value) {
		case ActivityDateRangeTypeEnum.Day:
		case ActivityDateRangeTypeEnum.ThreeDays:
		case ActivityDateRangeTypeEnum.Week:
		case ActivityDateRangeTypeEnum.TwoWeeks:
		case ActivityDateRangeTypeEnum.Month:
		case ActivityDateRangeTypeEnum.ThreeMonths:
		case ActivityDateRangeTypeEnum.Year:
			date.value = todayStr
			endDate.value = undefined
			break
		case ActivityDateRangeTypeEnum.CustomRange:
			date.value = formatToUsString(dateFrom.value)
			endDate.value = formatToUsString(dateTo.value)
			break
	}
}

watch([selectedRangeType, dateFrom], () => emitValues(), {immediate: true, deep: true})
watch(dateTo, () => {
	if (selectedRangeType.value === ActivityDateRangeTypeEnum.CustomRange)
		emitValues()
}, {})
</script>
