<template>
<div class="pa-2 w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
		<h1 class="text-h4">Activity History</h1>
		<template v-if="activeTab === 'dashboard'">
			<HistoryDateRangeSelector v-model:dateFrom="dateFrom" v-model:dateTo="dateTo"/>
			<HistoryGroupBySelector v-model="groupBy"/>
		</template>
	</div>

	<!-- Tabs -->
	<VTabs v-model="activeTab" class="mb-4">
		<VTab value="dashboard">Dashboard</VTab>
		<VTab value="timeline">Detailed Timeline</VTab>
	</VTabs>

	<!-- Tab Content -->
	<VWindow v-model="activeTab" class="flex-fill" style="overflow-y: auto">
		<!-- Dashboard Tab -->
		<VWindowItem value="dashboard">
			<div class="pa-1">
				<!-- Stacked Bars -->
				<HistoryStackedBars
					class="mb-6"
					:data="stackedBarsData"
					:loading="stackedBarsLoading"
				/>

				<!-- Summary Cards + Pie Chart -->
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
		</VWindowItem>

		<!-- Detailed Timeline Tab -->
		<VWindowItem value="timeline">
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
		</VWindowItem>
	</VWindow>
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
import {HistoryStackedBarsRequest} from '@/dtos/request/historyDashboard/HistoryStackedBarsRequest.ts'
import {HistoryPieChartRequest} from '@/dtos/request/historyDashboard/HistoryPieChartRequest.ts'
import {HistorySummaryCardsRequest} from '@/dtos/request/historyDashboard/HistorySummaryCardsRequest.ts'
import {getHistoryPieChart, getHistoryStackedBars, getHistorySummaryCards} from '@/api/historyDashboardApi.ts'
import type {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import type {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import type {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import HistoryDateRangeSelector from '@/components/historyDashboard/controls/HistoryDateRangeSelector.vue'
import HistoryGroupBySelector from '@/components/historyDashboard/controls/HistoryGroupBySelector.vue'
import HistoryStackedBars from '@/components/historyDashboard/stackedBars/HistoryStackedBars.vue'
import HistorySummaryCards from '@/components/historyDashboard/summaryCards/HistorySummaryCards.vue'
import HistoryPieChartSection from '@/components/historyDashboard/pieChart/HistoryPieChartSection.vue'
import HistoryPanelFilter from '@/components/history/HistoryPanelFilter.vue'
import HistoryRecordItem from '@/components/history/HistoryRecordItem.vue'
import {useDisplay} from 'vuetify/framework';

const {formatLocalized} = useMoment()
const {xlAndUp} = useDisplay()
// --- Tab State ---
const activeTab = ref<'dashboard' | 'timeline'>('dashboard')

// --- Dashboard State ---
const dateFrom = ref('')
const dateTo = ref('')
const groupBy = ref<HistoryGroupBy>(HistoryGroupBy.Activity)
const selectedGroup = ref<string | null>(null)
const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
const topN = ref(4)

// --- Dashboard Data ---
const stackedBarsData = ref<HistoryStackedBarsResponse | null>(null)
const pieChartData = ref<HistoryPieChartResponse | null>(null)
const summaryCardsData = ref<HistorySummaryCardsResponse | null>(null)

// --- Loading States ---
const stackedBarsLoading = ref(false)
const pieChartLoading = ref(false)
const summaryCardsLoading = ref(false)

// --- Dashboard Fetch Functions ---
async function fetchStackedBars() {
	stackedBarsLoading.value = true
	try {
		stackedBarsData.value = await getHistoryStackedBars(
			new HistoryStackedBarsRequest(dateFrom.value, dateTo.value, groupBy.value)
		)
	} finally {
		stackedBarsLoading.value = false
	}
}

async function fetchPieChart() {
	pieChartLoading.value = true
	try {
		pieChartData.value = await getHistoryPieChart(
			new HistoryPieChartRequest(dateFrom.value, dateTo.value, groupBy.value, 1)
		)
	} finally {
		pieChartLoading.value = false
	}
}

async function fetchSummaryCards() {
	summaryCardsLoading.value = true
	try {
		summaryCardsData.value = await getHistorySummaryCards(
			new HistorySummaryCardsRequest(dateFrom.value, dateTo.value, groupBy.value, selectedBaseline.value, topN.value)
		)
	} finally {
		summaryCardsLoading.value = false
	}
}

function fetchAllDashboard() {
	if (!dateFrom.value || !dateTo.value) return
	selectedGroup.value = null
	fetchStackedBars()
	fetchPieChart()
	fetchSummaryCards()
}

watch([dateFrom, dateTo, groupBy], () => fetchAllDashboard())

watch(selectedBaseline, () => fetchSummaryCards())

// --- Dashboard Event Handlers ---
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

// --- Timeline State (existing logic) ---
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
