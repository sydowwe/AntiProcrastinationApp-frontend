<template>
<div class="pa-2 w-100 h-100 d-flex flex-column">
	<!-- Header -->
	<div class="mb-5 w-100 d-flex align-center ga-6 flex-wrap">
		<h1 class="text-h4">Activity Dashboard</h1>
		<div class="d-flex align-center ga-5 flex-wrap">
			<VDateInput
				v-model="date"
				label="Date"
				hideDetails
				:max="today"
				density="compact"
				style="min-width: 200px; max-width: 200px"
			/>
			<TimeRangePicker
				v-model:start="timeFrom"
				v-model:end="timeTo"
				density="compact"
			/>
			<VBtnToggle
				v-model="selectedVisualization"
				mandatory
				variant="outlined"
				color="secondaryOutline"
				style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
			>
				<VBtn value="stackedBars" height="40px">
					Stacked Bars
				</VBtn>
				<VBtn value="timeline" height="40px">
					Timeline
				</VBtn>
			</VBtnToggle>
		</div>
	</div>

	<!-- Visualization Content -->
	<div class="flex-fill">
		<StackedBarsChart
			class="w-100"
			v-if="selectedVisualization === 'stackedBars'"
			:windows="stackedBarsWindows"
			:loading="stackedBarsLoading"
			:initialWindowSize="selectedWindowSize"
			:timeFrom
			:timeTo
			:windowSizeOptions="activityWindowSizeOptions"
			@windowSizeChange="handleWindowSizeChange"
			@activityClick="handleActivityClick"
		/>
		<ActivityTimeline
			v-else
			:primarySessions
			:detailSessions
			:backgroundSessions
			:from="timelineFrom"
			:to="timelineTo"
			:loading="timelineLoading"
			@sessionClick="handleSessionClick"
		/>
	</div>

	<!-- Top Section: Summary Cards + Pie Chart -->
	<div class="mt-6">
		<VRow>
			<VCol cols="12" lg="7" class="pr-8 pb-3">
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
			<VCol cols="12" lg="5" class="pb-3">
				<ActivityPieChartSection
					v-model:selectedDomain="selectedDomain"
					:domains="pieChartData?.domains ?? []"
					:dayTotals="pieChartData?.totals"
					:loading="topDomainsLoading"
				/>
			</VCol>
		</VRow>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {Time} from '@/dtos/dto/Time.ts'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import StackedBarsChart from '@/components/activityTracking/stackedBars/StackedBarsChart.vue'
import ActivityTimeline from '@/components/activityTracking/timeline/ActivityTimeline.vue'
import {BaselineOption, BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'
import type {ActivityWindow} from '@/dtos/response/activityTracking/stackedBars/ActivityWindow.ts'
import type {TimelineSessionDto} from '@/dtos/response/activityTracking/timeline/TimelineSessionDto.ts'
import {TimelineResponse} from '@/dtos/response/activityTracking/timeline/TimelineResponse.ts'
import {getPieChart, getStackedBarsData, getSummaryCards, getTimeline} from '@/api/activityTrackingApi'
import ActivitySummaryCards from '@/components/activityTracking/summaryCards/ActivitySummaryCards.vue';
import {VDateInput} from 'vuetify/labs/components';
import {SummaryCardsData} from '@/dtos/response/activityTracking/topDomains/SummaryCardsData.ts';
import {SummaryCardsRequest} from '@/dtos/request/activityTracking/SummaryCardsRequest.ts';
import {PieChartRequest} from '@/dtos/request/activityTracking/PieChartRequest.ts';
import type {PieChartData} from '@/dtos/response/activityTracking/pieChart/PieChartData.ts';
import ActivityPieChartSection from '@/components/activityTracking/pieChart/ActivityPieChartSection.vue';
import {StackedBarsRequest} from '@/dtos/request/activityTracking/StackedBarsRequest.ts'
import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts';
import type {StackedBarsInputWindow} from '@/components/activityTracking/stackedBars/dto/StackedBarsInput'
import {getDomainColor} from '@/utils/domainColor'

// --- Date & Time State ---
const today = new Date()
const date = ref<Date>(new Date())
const timeFrom = ref(new Time(7, 0))
const timeTo = ref(new Time(0, 0))

// --- Shared State ---
const selectedDomain = ref<string | null>(null)
const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
const selectedVisualization = ref<'stackedBars' | 'timeline'>('timeline')
const selectedWindowSize = ref(30)

// --- Window size options for single day ---
const activityWindowSizeOptions = [15, 20, 30, 60, 90, 120]

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

const primarySessions = computed(() => timelineData.value?.primarySessions ?? [])
const detailSessions = computed(() => timelineData.value?.detailSessions ?? [])
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

// --- Map ActivityWindow[] → StackedBarsInputWindow[] ---
const stackedBarsWindows = computed<StackedBarsInputWindow[]>(() => {
	return stackedBarsData.value.map((w) => ({
		windowStart: w.windowStart,
		windowEnd: w.windowEnd,
		items: w.activities.map((a) => ({
			name: a.domain,
			activeSeconds: a.activeSeconds,
			backgroundSeconds: a.backgroundSeconds,
			color: getDomainColor(a.domain),
			url: a.url,
		})),
	}))
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
			new SummaryCardsRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value, selectedBaseline.value, 4)
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
			new StackedBarsRequest(
				formatDateForApi(date.value),
				timeFrom.value,
				timeTo.value,
				selectedWindowSize.value,
			)
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

function handleActivityClick(_window: StackedBarsInputWindow, name: string) {
	selectedDomain.value = name
}

function handleSessionClick(session: TimelineSessionDto) {
	selectedDomain.value = session.domain
}
</script>
