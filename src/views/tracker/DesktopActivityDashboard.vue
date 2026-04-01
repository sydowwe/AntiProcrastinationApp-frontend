<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<!-- Header -->
		<div
			class="w-100 mb-3 d-flex align-center ga-6 flex-wrap bg-background"
			style="position: sticky; top: 0; z-index: 1000"
		>
			<h1 class="text-h4">Desktop Activity</h1>
			<div class="d-flex align-center ga-5 flex-wrap">
				<MyDateInput
					v-model="date"
					label="Date"
					hideDetails
					:max="today"
					density="compact"
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
					<VBtn
						value="stackedBars"
						height="40px"
					>
						Stacked Bars
					</VBtn>
					<VBtn
						value="timeline"
						height="40px"
					>
						Timeline
					</VBtn>
				</VBtnToggle>
			</div>
		</div>

		<!-- Visualization Content -->
		<div class="flex-fill">
			<StackedBarsChart
				v-if="selectedVisualization === 'stackedBars'"
				class="w-100"
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

		<!-- Bottom Section: Summary Cards + Pie Chart -->
		<div class="mt-6">
			<VRow>
				<VCol
					cols="12"
					lg="7"
					class="pr-8 pb-3"
				>
					<ActivitySummaryCards
						title="Top Processes"
						:domains="summaryCardsData"
						:baselineOptions
						:selectedBaseline
						:selectedDomain="selectedProductName"
						:loading="summaryCardsLoading"
						@update:selectedBaseline="handleBaselineChange"
						@domainClick="handleProcessSelect"
					/>
				</VCol>
				<VCol
					cols="12"
					lg="5"
					class="pb-3"
				>
					<DesktopPieChartSection
						v-model:selectedProductName="selectedProductName"
						:processes="pieChartData?.processes ?? []"
						:totals="pieChartData?.totals"
						:loading="pieChartLoading"
						:from="timelineFrom"
						:to="timelineTo"
					/>
				</VCol>
			</VRow>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import MyDateInput from '@/components/general/dateTime/MyDateInput.vue'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import StackedBarsChart from '@/components/activityTracking/stackedBars/StackedBarsChart.vue'
	import ActivityTimeline from '@/components/activityTracking/timeline/ActivityTimeline.vue'
	import ActivitySummaryCards from '@/components/activityTracking/summaryCards/ActivitySummaryCards.vue'
	import DesktopPieChartSection from '@/components/activityTracking/desktop/DesktopPieChartSection.vue'
	import { BaselineOption, BaselineType } from '@/components/activityTracking/summaryCards/BaselineOption.ts'
	import { SummaryCardsData } from '@/dtos/response/activityTracking/topDomains/SummaryCardsData.ts'
	import { TimelineSessionDto } from '@/dtos/response/activityTracking/timeline/TimelineSessionDto.ts'
	import type { StackedBarsInputWindow } from '@/components/activityTracking/stackedBars/dto/StackedBarsInput'
	import { getDomainColor } from '@/utils/domainColor'
	import {
		getDesktopPieChart,
		getDesktopStackedBars,
		getDesktopSummaryCards,
		getDesktopTimeline,
	} from '@/api/desktopActivityTrackingApi.ts'
	import { DesktopStackedBarsRequest } from '@/dtos/request/activityTracking/desktop/dashboard/DesktopStackedBarsRequest.ts'
	import { DesktopTimelineRequest } from '@/dtos/request/activityTracking/desktop/dashboard/DesktopTimelineRequest.ts'
	import { DesktopSummaryCardsRequest } from '@/dtos/request/activityTracking/desktop/dashboard/DesktopSummaryCardsRequest.ts'
	import { DesktopPieChartRequest } from '@/dtos/request/activityTracking/desktop/dashboard/DesktopPieChartRequest.ts'
	import type { DesktopStackedBarsWindow } from '@/dtos/response/activityTracking/desktop/DesktopStackedBarsWindow.ts'
	import type { DesktopTimelineResponse } from '@/dtos/response/activityTracking/desktop/DesktopTimelineResponse.ts'
	import type { DesktopProcessSummaryDto } from '@/dtos/response/activityTracking/desktop/DesktopProcessSummaryDto.ts'
	import type { DesktopPieChartResponse } from '@/dtos/response/activityTracking/desktop/DesktopPieChartResponse.ts'

	// --- Date & Time State ---
	const today = new Date()
	const date = ref<Date>(new Date())
	const timeFrom = ref(new Time(7, 0))
	const timeTo = ref(new Time(0, 0))

	// --- Shared State ---
	const selectedProductName = ref<string | null>(null)
	const selectedBaseline = ref<BaselineType>(BaselineType.Last7Days)
	const selectedVisualization = ref<'stackedBars' | 'timeline'>('timeline')
	const selectedWindowSize = ref(30)

	const activityWindowSizeOptions = [15, 20, 30, 60, 90, 120]

	const baselineOptions: BaselineOption[] = [
		new BaselineOption(BaselineType.Last7Days, 'Last 7 days'),
		new BaselineOption(BaselineType.Last30Days, 'Last 30 days'),
		new BaselineOption(BaselineType.SameWeekday, 'Same weekday'),
		new BaselineOption(BaselineType.AllTime, 'All time'),
	]

	// --- Raw API Data ---
	const summaryCardsRaw = ref<DesktopProcessSummaryDto[] | null>(null)
	const pieChartData = ref<DesktopPieChartResponse | null>(null)
	const stackedBarsRaw = ref<DesktopStackedBarsWindow[]>([])
	const timelineRaw = ref<DesktopTimelineResponse | null>(null)

	// --- Loading States ---
	const summaryCardsLoading = ref(false)
	const pieChartLoading = ref(false)
	const stackedBarsLoading = ref(false)
	const timelineLoading = ref(false)

	// --- Computed: map desktop summary cards → SummaryCardsData ---
	const summaryCardsData = computed<SummaryCardsData[] | null>(() => {
		if (!summaryCardsRaw.value) return null
		return summaryCardsRaw.value.map(
			d =>
				new SummaryCardsData(
					d.productName,
					d.active,
					d.background,
					(d.active?.seconds ?? 0) + (d.background?.seconds ?? 0),
					d.isNew,
				),
		)
	})

	// --- Computed: map desktop stacked bars → StackedBarsInputWindow[] ---
	const stackedBarsWindows = computed<StackedBarsInputWindow[]>(() =>
		stackedBarsRaw.value.map(w => ({
			windowStart: w.windowStart,
			windowEnd: w.windowEnd,
			items: w.activities.map(a => ({
				name: a.productName,
				activeSeconds: a.activeSeconds,
				backgroundSeconds: a.backgroundSeconds,
				color: getDomainColor(a.processName),
			})),
		})),
	)

	// --- Computed: map desktop timeline sessions → TimelineSessionDto[] ---
	const primarySessions = computed<TimelineSessionDto[]>(
		() =>
			timelineRaw.value?.primarySessions.map(
				s =>
					new TimelineSessionDto(
						s.id,
						s.productName,
						s.startedAt,
						s.endedAt,
						s.durationSeconds,
						s.totalSeconds,
					),
			) ?? [],
	)

	const detailSessions = computed<TimelineSessionDto[]>(
		() =>
			timelineRaw.value?.detailSessions.map(
				s =>
					new TimelineSessionDto(
						s.id,
						s.productName,
						s.startedAt,
						s.endedAt,
						s.durationSeconds,
						s.totalSeconds,
					),
			) ?? [],
	)

	const backgroundSessions = computed<TimelineSessionDto[]>(
		() =>
			timelineRaw.value?.backgroundSessions.map(
				s =>
					new TimelineSessionDto(
						s.id,
						s.productName,
						s.startedAt,
						s.endedAt,
						s.durationSeconds,
						s.totalSeconds,
					),
			) ?? [],
	)

	// --- Timeline from/to as full Date objects ---
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

	// --- Helpers ---
	function formatDateForApi(d: Date): string {
		const year = d.getFullYear()
		const month = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// --- Fetch Functions ---
	async function fetchSummaryCards() {
		summaryCardsLoading.value = true
		try {
			summaryCardsRaw.value = await getDesktopSummaryCards(
				new DesktopSummaryCardsRequest(
					formatDateForApi(date.value),
					timeFrom.value,
					timeTo.value,
					selectedBaseline.value,
					4,
				),
			)
		} finally {
			summaryCardsLoading.value = false
		}
	}

	async function fetchPieChart() {
		pieChartLoading.value = true
		try {
			pieChartData.value = await getDesktopPieChart(
				new DesktopPieChartRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value, 1),
			)
		} finally {
			pieChartLoading.value = false
		}
	}

	async function fetchStackedBars() {
		stackedBarsLoading.value = true
		try {
			stackedBarsRaw.value = await getDesktopStackedBars(
				new DesktopStackedBarsRequest(
					formatDateForApi(date.value),
					timeFrom.value,
					timeTo.value,
					selectedWindowSize.value,
				),
			)
		} finally {
			stackedBarsLoading.value = false
		}
	}

	async function fetchTimeline() {
		timelineLoading.value = true
		try {
			timelineRaw.value = await getDesktopTimeline(
				new DesktopTimelineRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value),
			)
		} finally {
			timelineLoading.value = false
		}
	}

	watch(
		[date, timeFrom, timeTo],
		() => {
			selectedProductName.value = null
			fetchSummaryCards()
			fetchPieChart()
			fetchStackedBars()
			fetchTimeline()
		},
		{ immediate: true },
	)

	watch(selectedBaseline, () => {
		fetchSummaryCards()
	})

	// --- Event Handlers ---
	function handleBaselineChange(value: BaselineType) {
		selectedBaseline.value = value
	}

	function handleProcessSelect(productName: string) {
		selectedProductName.value = selectedProductName.value === productName ? null : productName
	}

	function handleWindowSizeChange(size: number) {
		selectedWindowSize.value = size
		fetchStackedBars()
	}

	function handleActivityClick(_window: StackedBarsInputWindow, name: string) {
		selectedProductName.value = selectedProductName.value === name ? null : name
	}

	function handleSessionClick(session: TimelineSessionDto) {
		// session.domain = productName (mapped during fetch)
		selectedProductName.value = selectedProductName.value === session.domain ? null : session.domain
	}
</script>
