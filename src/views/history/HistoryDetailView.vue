<template>
<div class="w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
		<VIconBtn icon="calendar-days" variant="tonal" @click="router.push({name: 'activityHistoryCalendar'})" style="margin-right: -12px"></VIconBtn>
		<h1 class="text-h4">History Detail</h1>
		<VBtnToggle
			v-model="selectedVisualization"
			mandatory
			variant="outlined"
			color="secondaryOutline"
			style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
		>
			<VBtn value="stackedBars" height="40px">Stacked Bars</VBtn>
			<VBtn value="timeline" height="40px">Timeline</VBtn>
		</VBtnToggle>
		<div class="d-flex align-center ga-4 flex-wrap">
			<MyDateInput
				v-model="dateModel"
				label="Date"
				hideDetails
				:max="today"
				density="compact"
			/>
			<TimeRangePicker v-model:start="timeFrom" v-model:end="timeTo" density="compact" hideDetails></TimeRangePicker>
		</div>
		<HistoryGroupBySelector v-if="isStackedBars" v-model="groupBy"/>
	</div>

	<!-- Visualization Toggle -->
	<div v-if="isStackedBars" class="flex-fill" style="min-height: 200px">
		<StackedBarsChart
			class="w-100"
			:windows="stackedBarsWindows"
			:loading="stackedBarsLoading"
			:timeFrom
			:timeTo
			:windowSizeOptions="windowSizeOptions"
			:initialWindowSize="selectedWindowSize"
			@windowSizeChange="handleWindowSizeChange"
		/>
	</div>

	<!-- Summary Cards + Pie Chart -->
	<div v-if="isStackedBars" class="mt-6">
		<VRow>
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

	<!-- Timeline -->
	<HistoryTimeline v-if="!isStackedBars" :date="date" :timeFrom :timeTo/>
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'
import {DetailStackedBarsRequest} from '@/dtos/request/activityHistory/historyDetail/DetailStackedBarsRequest.ts'
import {DetailPieChartRequest} from '@/dtos/request/activityHistory/historyDetail/DetailPieChartRequest.ts'
import {DetailSummaryCardsRequest} from '@/dtos/request/activityHistory/historyDetail/DetailSummaryCardsRequest.ts'
import {getDetailPieChart, getDetailStackedBars, getDetailSummaryCards} from '@/api/historyDashboardApi.ts'
import type {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import type {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import type {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import type {StackedBarsInputWindow} from '@/components/activityTracking/stackedBars/dto/StackedBarsInput.ts'
import {Time} from '@/dtos/dto/Time.ts'
import {getDomainColor} from '@/utils/domainColor.ts'
import HistoryGroupBySelector from '@/components/historyDashboard/controls/HistoryGroupBySelector.vue'
import StackedBarsChart from '@/components/activityTracking/stackedBars/StackedBarsChart.vue'
import HistorySummaryCards from '@/components/historyDashboard/summaryCards/HistorySummaryCards.vue'
import HistoryPieChartSection from '@/components/historyDashboard/pieChart/HistoryPieChartSection.vue'
import HistoryTimeline from '@/components/historyDashboard/HistoryTimeline.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import MyDateInput from '@/components/general/dateTime/MyDateInput.vue';

const route = useRoute()
const router = useRouter()

// --- State ---
const today = new Date()
const dateModel = ref<Date>(route.query.date ? new Date(route.query.date as string) : new Date())
const timeFrom = ref(new Time(8, 0))
const timeTo = ref(new Time(23, 59))
const groupBy = ref<HistoryGroupBy>(HistoryGroupBy.Activity)
const selectedGroup = ref<string | null>(null)
const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
const topN = ref(4)
const selectedWindowSize = ref(30)
const selectedVisualization = ref<'stackedBars' | 'timeline'>('timeline')

const isStackedBars = computed(() => selectedVisualization.value === 'stackedBars')
// --- Window size options for single day ---
const windowSizeOptions = [15, 20, 30, 60]

// --- Formatting ---
function formatDateForApi(d: Date): string {
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const date = computed(() => formatDateForApi(dateModel.value))

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
		stackedBarsData.value = await getDetailStackedBars(
			new DetailStackedBarsRequest(
				date.value,
				timeFrom.value,
				timeTo.value,
				selectedWindowSize.value,
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
		pieChartData.value = await getDetailPieChart(
			new DetailPieChartRequest(
				groupBy.value,
				20,
				date.value,
				timeFrom.value,
				timeTo.value,
			)
		)
	} finally {
		pieChartLoading.value = false
	}
}

async function fetchSummaryCards() {
	summaryCardsLoading.value = true
	try {
		summaryCardsData.value = await getDetailSummaryCards(
			new DetailSummaryCardsRequest(
				date.value,
				timeFrom.value,
				timeTo.value,
				groupBy.value,
				selectedBaseline.value,
				topN.value,
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

watch([dateModel, timeFrom, timeTo, groupBy], () => fetchAll(), {immediate: true})
watch(selectedBaseline, () => fetchSummaryCards())
watch(date, (newDate) => router.replace({query: {...route.query, date: newDate}}))

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
