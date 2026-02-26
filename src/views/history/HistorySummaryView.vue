<template>
<div class="pa-2 w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
		<h1 class="text-h4">Activity History</h1>
		<HistoryDateRangeSelector
			v-model:date="date"
			v-model:rangeType="rangeType"
			v-model:endDate="endDate"
		/>
		<HistoryGroupBySelector v-model="groupBy"/>
	</div>

	<!-- Body -->
	<div class="pa-1 flex-fill d-flex flex-column ga-6" style="min-height: 0">
		<!-- Stacked Bars -->
		<StackedBarsChart
			class="flex-fill"
			style="min-height: 200px"
			:windows="stackedBarsWindows"
			:loading="stackedBarsLoading"
			:timeFrom="chartTimeFrom"
			:timeTo="chartTimeTo"
			:windowSizeOptions="windowSizeOptions"
			:initialWindowSize="selectedWindowSize"
			@windowSizeChange="handleWindowSizeChange"
		>
			<template v-slot:header-right>
				<TimeRangePicker
					class="flex-shrink-0"
					v-model:start="windowStartTime"
					v-model:end="windowEndTime"
					label="Day from"
					density="compact"
					hideDetails
					allowedMinutesSelected="30"
				/>
			</template>
		</StackedBarsChart>

		<!-- Summary Cards + Pie Chart -->
		<VRow class="flex-shrink-0 flex-grow-0">
			<VCol cols="12" lg="6" class="pr-lg-8 pb-3">
				<HistorySummaryCards
					:data="summaryCardsData"
					:groupBy="groupBy"
					:selectedGroup="selectedGroup"
					:selectedBaseline="selectedBaseline"
					:topN="topN"
					:loading="summaryCardsLoading"
					@update:selectedBaseline="handleBaselineChange"
					@update:topN="handleTopNChange"
					@groupClick="handleGroupSelect"
				/>
			</VCol>
			<VCol cols="12" lg="6" class="pb-3">
				<HistoryPieChartSection
					v-model:selectedGroup="selectedGroup"
					:data="pieChartData"
					:loading="pieChartLoading"
				/>
			</VCol>
		</VRow>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'
import {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'
import {getSummaryPieChart, getSummaryStackedBars, getSummarySummaryCards} from '@/api/historyDashboardApi.ts'
import type {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import type {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import type {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import type {StackedBarsInputWindow} from '@/components/activityTracking/stackedBars/dto/StackedBarsInput.ts'
import {Time} from '@/dtos/dto/Time.ts'
import {getDomainColor} from '@/utils/domainColor.ts'
import HistoryDateRangeSelector from '@/components/historyDashboard/controls/HistoryDateRangeSelector.vue'
import HistoryGroupBySelector from '@/components/historyDashboard/controls/HistoryGroupBySelector.vue'
import StackedBarsChart from '@/components/activityTracking/stackedBars/StackedBarsChart.vue'
import HistorySummaryCards from '@/components/historyDashboard/summaryCards/HistorySummaryCards.vue'
import HistoryPieChartSection from '@/components/historyDashboard/pieChart/HistoryPieChartSection.vue'
import {HistorySummaryStackedBarsRequest} from '@/dtos/request/activityHistory/historySummary/HistorySummaryStackedBarsRequest.ts';
import {HistorySummaryPieChartRequest} from '@/dtos/request/activityHistory/historySummary/HistorySummaryPieChartRequest.ts';
import {HistorySummarySummaryCardsRequest} from '@/dtos/request/activityHistory/historySummary/HistorySummarySummaryCardsRequest.ts';
import {useMoment} from '@/utils/momentHelper.ts';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';

const {formatTimeDtoToUtcTimeDto} = useMoment()
// --- State ---
const date = ref('')
const rangeType = ref<ActivityDateRangeTypeEnum>(ActivityDateRangeTypeEnum.Week)
const endDate = ref<string | undefined>(undefined)
const groupBy = ref<HistoryGroupBy>(HistoryGroupBy.Activity)
const selectedGroup = ref<string | null>(null)
const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
const topN = ref(4)
const selectedWindowSize = ref(240)
const windowStartTime = ref(new Time(8, 0))
const windowEndTime = ref(new Time(1, 0))

// --- Window size options based on range type ---
const weekOptions = [2, 3, 4, 5, 8, 10, 12, 16, 24].map(h => h * 60)

const windowSizeOptions = computed(() => {
	switch (rangeType.value) {
		case ActivityDateRangeTypeEnum.Day:
			return [15, 30, 60, 120, 240]
		case ActivityDateRangeTypeEnum.ThreeDays:
			return [30, 60, 120, 240, 480]
		case ActivityDateRangeTypeEnum.Week:
			return weekOptions
		case ActivityDateRangeTypeEnum.TwoWeeks:
			return [60, 120, 240, 480, 720, 1440]
		case ActivityDateRangeTypeEnum.Month:
			return [60, 120, 240, 480, 720, 1440, 10080]
		case ActivityDateRangeTypeEnum.ThreeMonths:
			return [720, 1440, 10080, 20160]
		case ActivityDateRangeTypeEnum.Year:
			return [1440, 10080, 20160, 43200]
		case ActivityDateRangeTypeEnum.CustomRange: {
			if (!date.value || !endDate.value) return weekOptions
			const start = new Date(date.value)
			const end = new Date(endDate.value)
			const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
			if (diffDays <= 7) return weekOptions
			if (diffDays <= 31) return [60, 120, 240, 480, 720, 1440, 10080]
			return [720, 1440, 10080, 20160, 43200]
		}
		default:
			return weekOptions
	}
})

watch(windowSizeOptions, (options) => {
	if (!options.includes(selectedWindowSize.value)) {
		selectedWindowSize.value = options[0]!
	}
})

// --- Time from/to for chart: derived from stacked bars response ---
const chartTimeFrom = computed(() => {
	if (!stackedBarsData.value || stackedBarsData.value.windows.length === 0) return new Time(0, 0)
	const first = stackedBarsData.value.windows[0]!
	const d = parseDate(first.windowStart)
	return Time.fromDate(d)
})

const chartTimeTo = computed(() => {
	if (!stackedBarsData.value || stackedBarsData.value.windows.length === 0) return new Time(23, 59)
	const last = stackedBarsData.value.windows[stackedBarsData.value.windows.length - 1]!
	const d = parseDate(last.windowEnd)
	return Time.fromDate(d)
})

// --- Data ---
const stackedBarsData = ref<HistoryStackedBarsResponse | null>(null)
const pieChartData = ref<HistoryPieChartResponse | null>(null)
const summaryCardsData = ref<HistorySummaryCardsResponse | null>(null)

// --- Loading States ---
const stackedBarsLoading = ref(false)
const pieChartLoading = ref(false)
const summaryCardsLoading = ref(false)

// --- Map HistoryWindow[] → StackedBarsInputWindow[] ---
function parseDate(dateStr: string): Date {
	const d = new Date(dateStr)
	if (!isNaN(d.getTime())) return d
	return new Date(dateStr.replace(' ', 'T'))
}

const stackedBarsWindows = computed<StackedBarsInputWindow[]>(() => {
	if (!stackedBarsData.value) return []
	return stackedBarsData.value.windows.map((w) => ({
		windowStart: parseDate(w.windowStart),
		windowEnd: parseDate(w.windowEnd),
		items: w.items.map((item) => ({
			name: item.name,
			activeSeconds: item.totalSeconds,
			backgroundSeconds: 0,
			color: item.color ?? getDomainColor(item.name),
		})),
	}))
})

// --- Fetch Functions ---
async function fetchStackedBars() {
	stackedBarsLoading.value = true
	try {
		stackedBarsData.value = await getSummaryStackedBars(
			new HistorySummaryStackedBarsRequest(
				date.value,
				rangeType.value,
				selectedWindowSize.value,
				formatTimeDtoToUtcTimeDto(windowStartTime.value),
				formatTimeDtoToUtcTimeDto(windowEndTime.value),
				endDate.value,
				groupBy.value,
			)
		)
	} finally {
		stackedBarsLoading.value = false
	}
}

async function fetchPieChart() {
	pieChartLoading.value = true
	try {
		pieChartData.value = await getSummaryPieChart(
			new HistorySummaryPieChartRequest(
				groupBy.value,
				20,
				date.value,
				rangeType.value,
				endDate.value,
			)
		)
	} finally {
		pieChartLoading.value = false
	}
}

async function fetchSummaryCards() {
	summaryCardsLoading.value = true
	try {
		summaryCardsData.value = await getSummarySummaryCards(
			new HistorySummarySummaryCardsRequest(
				date.value,
				rangeType.value,
				groupBy.value,
				selectedBaseline.value,
				topN.value,
				endDate.value,
			)
		)
	} finally {
		summaryCardsLoading.value = false
	}
}

function fetchAll() {
	if (!date.value) return
	selectedGroup.value = null
	fetchStackedBars()
	fetchPieChart()
	fetchSummaryCards()
}

watch([date, rangeType, endDate, groupBy], () => fetchAll())
watch([windowStartTime, windowEndTime], () => fetchStackedBars())
watch(selectedBaseline, () => fetchSummaryCards())

// --- Event Handlers ---
function handleBaselineChange(value: BaselineType) {
	selectedBaseline.value = value
}

function handleTopNChange(value: number) {
	topN.value = value
	fetchSummaryCards()
}

function handleGroupSelect(name: string) {
	selectedGroup.value = selectedGroup.value === name ? null : name
}

function handleWindowSizeChange(size: number) {
	selectedWindowSize.value = size
	fetchStackedBars()
}
</script>
