<template>
<div class="pa-2 w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
		<h1 class="text-h4">History Detail</h1>
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
		<div class="d-flex align-center ga-4 flex-wrap">
			<VDateInput
				v-model="dateModel"
				label="Date"
				hideDetails
				:max="today"
				density="comfortable"
				style="min-width: 180px; max-width: 180px"
			/>
			<TimeRangePicker v-model:start="timeFrom" v-model:end="timeTo" density="comfortable" hideDetails></TimeRangePicker>
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

	<div v-if="!isStackedBars" class="flex-fill mx-3" style="min-height: 200px; overflow-y: auto">
		<VRow justify="start" class="my-2 mx-0">
			<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
				<template v-for="(record, i) in firstHalf" :key="record.id">
					<div v-if="isDayChange(firstHalf, i)" class="w-100 bg-blue-grey rounded text-center mb-2">
						{{ formatLocalized(record.startTimestamp, 'L') }}
					</div>
					<HistoryRecordItem class="my-2 my-md-3 w-100" :record="record" @edit="handleEdit" @delete="handleDeleteRequest"/>
				</template>
			</VCol>
			<VCol cols="12" lg="6" class="py-0 py-md-2 d-flex flex-column">
				<template v-for="(record, i) in secondHalf" :key="record.id">
					<div v-if="isDayChange(secondHalf, i)" class="w-100 bg-blue-grey rounded text-center mb-2">
						{{ formatLocalized(record.startTimestamp, 'L') }}
					</div>
					<HistoryRecordItem class="my-2 my-md-3 w-100" :record="record" @edit="handleEdit" @delete="handleDeleteRequest"/>
				</template>
			</VCol>
		</VRow>

		<MyDialog
			title="Delete confirmation"
			text="Are you sure you want to delete this activity history record?"
			v-model="deleteDialog"
			@confirmed="confirmDelete"
			confirmBtnColor="error"
		/>
		<EditActivityHistoryDialog ref="editDialogRef" @saved="fetchDetailTimeline"/>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {useMoment} from '@/scripts/momentHelper.ts'
import {API} from '@/plugins/axiosConfig.ts'
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
import {Time} from '@/utils/Time.ts'
import {getDomainColor} from '@/utils/domainColor.ts'
import {VDateInput} from 'vuetify/labs/components'
import HistoryGroupBySelector from '@/components/historyDashboard/controls/HistoryGroupBySelector.vue'
import StackedBarsChart from '@/components/activityTracking/stackedBars/StackedBarsChart.vue'
import HistorySummaryCards from '@/components/historyDashboard/summaryCards/HistorySummaryCards.vue'
import HistoryPieChartSection from '@/components/historyDashboard/pieChart/HistoryPieChartSection.vue'
import HistoryRecordItem from '@/components/history/HistoryRecordItem.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {DetailTimelineRequest} from '@/dtos/request/activityHistory/historyDetail/DetailTimelineRequest.ts';
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import EditActivityHistoryDialog from '@/components/history/EditActivityHistoryDialog.vue';
import {useActivityHistoryCrud} from '@/api/ConcretesCrudComposable.ts';

const route = useRoute()
const {formatLocalized} = useMoment()

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
const selectedVisualization = ref<'stackedBars' | 'timeline'>('stackedBars')

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
	fetchDetailTimeline()
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
const historyList = ref<ActivityHistory[]>([])
const firstHalf = computed(() => historyList.value.slice(0, Math.ceil(historyList.value.length / 2)))
const secondHalf = computed(() => historyList.value.slice(Math.ceil(historyList.value.length / 2)))

const hasMultipleDays = computed(() => {
	if (historyList.value.length < 2) return false
	const first = historyList.value[0]!.startTimestamp
	const last = historyList.value[historyList.value.length - 1]!.startTimestamp
	return first.getDate() !== last.getDate()
		|| first.getMonth() !== last.getMonth()
		|| first.getFullYear() !== last.getFullYear()
})

function isDayChange(list: ActivityHistory[], index: number): boolean {
	if (!hasMultipleDays.value) return false
	if (index === 0) return true
	const prev = list[index - 1]?.startTimestamp
	const curr = list[index]?.startTimestamp
	if (!prev || !curr) return false
	return prev.getFullYear() !== curr.getFullYear()
		|| prev.getMonth() !== curr.getMonth()
		|| prev.getDate() !== curr.getDate()
}

function fetchDetailTimeline() {
	const request = new DetailTimelineRequest(date.value, timeFrom.value, timeTo.value)
	API.post('/activity-history/filter', request)
		.then((response) => {
			historyList.value = ActivityHistory.listFromObjects(response.data)
		})
		.catch((error) => {
			console.log(error)
		})
}

// --- Delete ---
const {deleteEntity} = useActivityHistoryCrud()
const deleteDialog = ref(false)
const deleteTargetId = ref<number | null>(null)

function handleDeleteRequest(id: number) {
	deleteTargetId.value = id
	deleteDialog.value = true
}

async function confirmDelete() {
	if (!deleteTargetId.value) return
	await deleteEntity(deleteTargetId.value)
	historyList.value = historyList.value.filter(r => r.id !== deleteTargetId.value)
	deleteDialog.value = false
	deleteTargetId.value = null
}

// --- Edit ---
const editDialogRef = ref<InstanceType<typeof EditActivityHistoryDialog>>()

function handleEdit(record: ActivityHistory) {
	editDialogRef.value?.open(record)
}
</script>
