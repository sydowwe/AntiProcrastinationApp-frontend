<template>
<div class="pa-2 w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
		<h1 class="text-h4">History Detail</h1>
		<div class="d-flex align-center ga-4 flex-wrap">
			<VDateInput
				v-model="dateModel"
				label="Date"
				hideDetails
				:max="today"
				density="comfortable"
				style="min-width: 180px; max-width: 180px"
			/>
			<TimePickerTextField
				v-model="timeFrom"
				label="From"
				density="comfortable"
				hideDetails
			/>
			<TimePickerTextField
				v-model="timeTo"
				label="To"
				density="comfortable"
				hideDetails
			/>
		</div>
		<HistoryGroupBySelector v-model="groupBy"/>
		<VBtnToggle
			v-model="selectedVisualization"
			mandatory
			variant="outlined"
			color="secondaryOutline"
			style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 48px"
		>
			<VBtn value="stackedBars" height="48px">Stacked Bars</VBtn>
			<VBtn value="timeline" height="48px">Timeline</VBtn>
		</VBtnToggle>
	</div>

	<!-- Visualization Toggle -->
	<div class="flex-fill" style="min-height: 200px">
		<StackedBarsChart
			v-if="selectedVisualization === 'stackedBars'"
			class="w-100"
			:windows="stackedBarsWindows"
			:loading="stackedBarsLoading"
			:timeFrom
			:timeTo
			:windowSizeOptions="windowSizeOptions"
			:initialWindowSize="selectedWindowSize"
			@windowSizeChange="handleWindowSizeChange"
		/>
		<div v-else>
			<!-- Detailed Timeline -->
			<HistoryPanelFilter @filterApplied="handleFilterApplied"/>
			<VRow justify="start" class="my-2 flex-fill px-5" style="overflow-y: auto">
				<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
					<div class="w-100" v-for="groupedRecord in groupedRecords?.slice(0, midpoint)" :key="groupedRecord.date">
						<div class="w-100 bg-blue-grey rounded text-center">{{ formatLocalized(groupedRecord.date, 'L') }}</div>
						<HistoryRecordItem
							class="my-2 my-md-3 w-100"
							:record="record"
							v-for="record in groupedRecord.historyList"
							:key="record.id"
						/>
					</div>
				</VCol>
				<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
					<div class="w-100" v-for="groupedRecord in groupedRecords?.slice(midpoint, groupedRecords.length)" :key="groupedRecord.date">
						<div class="w-100 bg-blue-grey rounded text-center">{{ groupedRecord.date }}</div>
						<HistoryRecordItem
							class="my-2 my-md-3 w-100"
							:record="record"
							v-for="record in groupedRecord.historyList"
							:key="record.id"
						/>
					</div>
				</VCol>
			</VRow>
		</div>
	</div>

	<!-- Summary Cards + Pie Chart -->
	<div class="mt-6">
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
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useMoment} from '@/scripts/momentHelper.ts'
import {API} from '@/plugins/axiosConfig.ts'
import {FilteredTableRequest} from '@/dtos/request/base/FilteredTableRequest.ts'
import type {ActivityHistoryFilter} from '@/dtos/dto/ActivityHistoryFilter.ts'
import {HistoryGroupedByDate} from '@/dtos/response/HistoryGroupedByDate.ts'
import {SortByRequest} from '@/dtos/request/base/SortByRequest.ts'
import {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'
import {DetailStackedBarsRequest} from '@/dtos/request/historyDetail/DetailStackedBarsRequest.ts'
import {DetailPieChartRequest} from '@/dtos/request/historyDetail/DetailPieChartRequest.ts'
import {DetailSummaryCardsRequest} from '@/dtos/request/historyDetail/DetailSummaryCardsRequest.ts'
import {getDetailPieChart, getDetailStackedBars, getDetailSummaryCards} from '@/api/historyDashboardApi.ts'
import type {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import type {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import type {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import type {StackedBarsInputWindow} from '@/components/activityTracking/stackedBars/dto/StackedBarsInput'
import {Time} from '@/utils/Time'
import {getDomainColor} from '@/utils/domainColor'
import {VDateInput} from 'vuetify/labs/components'
import TimePickerTextField from '@/components/general/dateTime/TimePickerTextField.vue'
import HistoryGroupBySelector from '@/components/historyDashboard/controls/HistoryGroupBySelector.vue'
import StackedBarsChart from '@/components/activityTracking/stackedBars/StackedBarsChart.vue'
import HistorySummaryCards from '@/components/historyDashboard/summaryCards/HistorySummaryCards.vue'
import HistoryPieChartSection from '@/components/historyDashboard/pieChart/HistoryPieChartSection.vue'
import HistoryPanelFilter from '@/components/history/HistoryPanelFilter.vue'
import HistoryRecordItem from '@/components/history/HistoryRecordItem.vue'

const {formatLocalized} = useMoment()

// --- State ---
const today = new Date()
const dateModel = ref<Date>(new Date())
const timeFrom = ref(new Time(0, 0))
const timeTo = ref(new Time(23, 59))
const groupBy = ref<HistoryGroupBy>(HistoryGroupBy.Activity)
const selectedGroup = ref<string | null>(null)
const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
const topN = ref(4)
const selectedWindowSize = ref(30)
const selectedVisualization = ref<'stackedBars' | 'timeline'>('stackedBars')

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

// --- Timeline State ---
const groupedRecords = ref<HistoryGroupedByDate[]>([])
const midpoint = computed(() => Math.ceil(groupedRecords.value.length / 2))

function handleFilterApplied(filterData: ActivityHistoryFilter, isDateRange: boolean) {
	let filter = {...filterData, dateTo: filterData.dateTo ? new Date(filterData.dateTo) : null}
	filter.dateTo?.setHours(23, 59, 59, 999)
	if (isDateRange) {
		filter.hoursBack = undefined
		filter.dateFrom?.setHours(0, 0, 1, 0)
	} else {
		filter.dateFrom = null
	}
	const request = new FilteredTableRequest<ActivityHistoryFilter>(100, 1, [new SortByRequest('date', false)], true, filter)
	API.post('/activity-history/filtered-table', request)
		.then((response) => {
			groupedRecords.value = HistoryGroupedByDate.listFromObjects(response.data)
		})
		.catch((error) => {
			console.log(error)
		})
}
</script>
