<template>
<div class="pa-2 w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-6 w-100 d-flex align-center ga-6 flex-wrap">
		<h1 class="text-h4">Activity Dashboard</h1>
		<div class="d-flex align-center ga-5 flex-wrap">
			<VDateInput
				v-model="date"
				label="Date"
				hideDetails
				:max="today"
				style="min-width: 200px; max-width: 200px"
			/>
			<TimeRangePicker
				v-model:start="timeFrom"
				v-model:end="timeTo"
			/>
			<VBtnToggle
				v-model="selectedVisualization"
				mandatory
				variant="outlined"
				color="secondaryOutline"
				style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important;"
			>
				<VBtn value="stackedBars">
					Stacked Bars
				</VBtn>
				<VBtn value="timeline">
					Timeline
				</VBtn>
			</VBtnToggle>
		</div>
	</div>

	<!-- Visualization Content -->
	<ActivityStackedBars
		v-if="selectedVisualization === 'stackedBars'"
		:windows="stackedBarsData"
		:loading="stackedBarsLoading"
		:initialWindowSize="selectedWindowSize"
		@windowSizeChange="handleWindowSizeChange"
		@activityClick="handleActivityClick"
	/>
	<ActivityTimeline
		v-else
		:activeSessions="activeSessions"
		:backgroundSessions="backgroundSessions"
		:from="timelineFrom"
		:to="timelineTo"
		:loading="timelineLoading"
		@sessionClick="handleSessionClick"
	/>

	<!-- Top Section: Summary Cards + Pie Chart -->
	<VRow class="mt-6">
		<VCol cols="12" lg="7" class="pr-8">
			<ActivitySummaryCards
				:domains="summaryCardsData"
				:baselineOptions="baselineOptions"
				:selectedBaseline="selectedBaseline"
				:selectedDomain="selectedDomain"
				:loading="topDomainsLoading"
				@update:selectedBaseline="handleBaselineChange"
				@domainClick="handleDomainSelect"
			/>
		</VCol>
		<VCol cols="12" lg="5">
			<ActivityPieChartSection
				v-model:selectedDomain="selectedDomain"
				:domains="pieChartData?.domains ?? []"
				:dayTotals="pieChartData?.totals"
				:loading="topDomainsLoading"
			/>
		</VCol>
	</VRow>
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {Time} from '@/utils/Time'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import ActivityStackedBars from '@/components/activityTracking/stackedBars/ActivityStackedBars.vue'
import ActivityTimeline from '@/components/activityTracking/timeline/ActivityTimeline.vue'
import {BaselineOption, BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'
import type {ActivityWindow} from '@/dtos/response/activityTracking/stackedBars/ActivityWindow.ts'
import type {TimelineSession} from '@/dtos/response/activityTracking/timeline/TimelineSession.ts'
import {TimelineResponse} from '@/dtos/response/activityTracking/timeline/TimelineResponse.ts'
import {getPieChart, getStackedBarsData, getSummaryCards, getTimeline} from '@/api/activityTrackingApi'
import ActivitySummaryCards from '@/components/activityTracking/summaryCards/ActivitySummaryCards.vue';
import {VDateInput} from 'vuetify/labs/components';
import {SummaryCardsData} from '@/dtos/response/activityTracking/topDomains/SummaryCardsData.ts';
import {SummaryCardsRequest} from '@/dtos/request/activityTracking/SummaryCardsRequest.ts';
import {PieChartRequest} from '@/dtos/request/activityTracking/PieChartRequest.ts';
import type {PieChartData} from '@/dtos/response/activityTracking/pieChart/PieChartData.ts';
import ActivityPieChartSection from '@/components/activityTracking/pieChart/ActivityPieChartSection.vue';
import {StackedBarsRequest} from '@/dtos/request/activityTracking/StackedBarsRequest.ts';
import {DateAndTimeRangeRequest} from '@/dtos/request/activityTracking/DateAndTimeRangeRequest.ts';

// --- Date & Time State ---
const today = new Date()
const date = ref<Date>(new Date('02-10-2026'))
const timeFrom = ref(new Time(7, 0))
const timeTo = ref(new Time(3, 0))

// --- Shared State ---
const selectedDomain = ref<string | null>(null)
const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
const selectedVisualization = ref<'stackedBars' | 'timeline'>('stackedBars')
const selectedWindowSize = ref(30)

// --- Baseline Options ---
const baselineOptions: BaselineOption[] = [
	new BaselineOption(BaselineType.Last7Days, 'Last 7 days'),
	new BaselineOption(BaselineType.Last30Days, 'Last 30 days'),
	new BaselineOption(BaselineType.SameWeekday, 'Same weekday'),
	new BaselineOption(BaselineType.AllTime, 'All time'),
]

const summaryCardsData = ref<SummaryCardsData[] | null>(null)

const pieChartData = ref<PieChartData | null>(null)

const stackedBarsData = ref<ActivityWindow[]>([])

const timelineData = ref<TimelineResponse | null>(null)

// --- Loading States ---
const topDomainsLoading = ref(false)
const pieChartLoading = ref(false)
const stackedBarsLoading = ref(false)
const timelineLoading = ref(false)

const activeSessions = computed(() => timelineData.value?.activeSessions ?? [])
const backgroundSessions = computed(() => timelineData.value?.backgroundSessions ?? [])

const timelineFrom = computed(() => {
	const d = new Date(date.value)
	d.setHours(timeFrom.value.hours, timeFrom.value.minutes, 0, 0)
	return d
})

const timelineTo = computed(() => {
	const d = new Date(date.value)
	d.setHours(timeTo.value.hours, timeTo.value.minutes, 0, 0)
	if (d <= timelineFrom.value) {
		d.setDate(d.getDate() + 1)
	}
	return d
})

// --- Formatting helpers ---
function formatDateForApi(d: Date): string {
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// --- Fetch Functions ---
async function fetchSummaryCardsData() {
	topDomainsLoading.value = true
	try {
		summaryCardsData.value = await getSummaryCards(
			new SummaryCardsRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value, selectedBaseline.value, 5)
		)
	} finally {
		topDomainsLoading.value = false
	}
}

async function fetchPieChart() {
	pieChartLoading.value = true
	try {
		pieChartData.value = await getPieChart(
			new PieChartRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value, 1)
		)
	} finally {
		pieChartLoading.value = false
	}
}

async function fetchStackedBarsData() {
	stackedBarsLoading.value = true
	try {
		stackedBarsData.value = await getStackedBarsData(
			new StackedBarsRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value, selectedWindowSize.value)
		)
	} finally {
		stackedBarsLoading.value = false
	}
}

async function fetchTimeline() {
	timelineLoading.value = true
	try {
		timelineData.value = await getTimeline(
			new DateAndTimeRangeRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value)
		)
	} finally {
		timelineLoading.value = false
	}
}

watch([date, timeFrom, timeTo], () => {
	selectedDomain.value = null
	fetchSummaryCardsData()
	fetchPieChart()
	fetchStackedBarsData()
	fetchTimeline()
}, {immediate: true})

watch(selectedBaseline, () => {
	fetchSummaryCardsData()
})

// --- Event Handlers ---
function handleBaselineChange(value: BaselineType) {
	selectedBaseline.value = value
}

function handleDomainSelect(domain: string) {
	selectedDomain.value = selectedDomain.value === domain ? null : domain
}

function handleWindowSizeChange(size: number) {
	selectedWindowSize.value = size
	fetchStackedBarsData()
}

function handleActivityClick(_window: ActivityWindow, domain: string) {
	selectedDomain.value = domain
}

function handleSessionClick(session: TimelineSession) {
	selectedDomain.value = session.domain
}
</script>
