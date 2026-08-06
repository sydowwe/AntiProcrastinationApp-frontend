<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<!-- Header -->
		<div
			class="w-100 mb-3 d-flex align-center ga-6 flex-wrap bg-background"
			style="position: sticky; top: 0; z-index: 1000"
		>
			<h1 class="text-h4">Android Activity</h1>
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
				:detailSessions="[]"
				:backgroundSessions="[]"
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
						title="Top Apps"
						:domains="summaryCardsData"
						:baselineOptions
						:selectedBaseline
						:selectedDomain="selectedAppLabel"
						:loading="summaryCardsLoading"
						@update:selectedBaseline="handleBaselineChange"
						@domainClick="handleAppSelect"
					/>
				</VCol>
				<VCol
					cols="12"
					lg="5"
					class="pb-3"
				>
					<AndroidPieChartSection
						v-model:selectedAppLabel="selectedAppLabel"
						:apps="pieChartData?.apps ?? []"
						:totals="pieChartData?.totals"
						:loading="pieChartLoading"
					/>
				</VCol>
			</VRow>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import ActivityTimeline from '@/core/activityTracking/component/timeline/ActivityTimeline.vue'
	import ActivitySummaryCards from '@/core/activityTracking/component/summaryCards/ActivitySummaryCards.vue'
	import AndroidPieChartSection from '@/core/activityTracking/component/android/AndroidPieChartSection.vue'
	import { BaselineOption, BaselineType } from '@/core/activityTracking/component/summaryCards/BaselineOption.ts'
	import { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
	import { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import {
		getAndroidPieChart,
		getAndroidStackedBars,
		getAndroidSummaryCards,
		getAndroidTimeline,
	} from '@/core/activityTracking/api/androidActivityTrackingApi.ts'
	import { AndroidStackedBarsRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidStackedBarsRequest.ts'
	import { AndroidTimelineRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidTimelineRequest.ts'
	import { AndroidSummaryCardsRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidSummaryCardsRequest.ts'
	import { AndroidPieChartRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidPieChartRequest.ts'
	import type { AndroidStackedBarsWindow } from '@/core/activityTracking/dto/response/android/AndroidStackedBarsWindow.ts'
	import type { AndroidTimelineResponse } from '@/core/activityTracking/dto/response/android/AndroidTimelineResponse.ts'
	import type { AndroidAppSummaryDto } from '@/core/activityTracking/dto/response/android/AndroidAppSummaryDto.ts'
	import type { AndroidPieChartResponse } from '@/core/activityTracking/dto/response/android/AndroidPieChartResponse.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

	// --- Date & Time State ---
	const today = new Date()
	const date = ref<Date>(new Date())
	const timeFrom = ref(new Time(7, 0))
	const timeTo = ref(new Time(0, 0))

	// --- Shared State ---
	const selectedAppLabel = ref<string | null>(null)
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
	const summaryCardsRaw = ref<AndroidAppSummaryDto[] | null>(null)
	const pieChartData = ref<AndroidPieChartResponse | null>(null)
	const stackedBarsRaw = ref<AndroidStackedBarsWindow[]>([])
	const timelineRaw = ref<AndroidTimelineResponse | null>(null)

	// --- Loading States ---
	const summaryCardsLoading = ref(false)
	const pieChartLoading = ref(false)
	const stackedBarsLoading = ref(false)
	const timelineLoading = ref(false)

	// --- Computed: map android summary cards → SummaryCardsData ---
	const summaryCardsData = computed<SummaryCardsData[] | null>(() => {
		if (!summaryCardsRaw.value) return null
		return summaryCardsRaw.value.map(
			d => new SummaryCardsData(d.appLabel, d.stat, null, d.stat?.seconds ?? 0, d.isNew),
		)
	})

	// --- Computed: map android stacked bars → StackedBarsInputWindow[] ---
	const stackedBarsWindows = computed<StackedBarsInputWindow[]>(() =>
		stackedBarsRaw.value.map(w => ({
			windowStart: w.windowStart,
			windowEnd: w.windowEnd,
			items: w.apps.map(a => ({
				name: a.appLabel,
				activeSeconds: a.seconds,
				backgroundSeconds: 0,
				color: getDomainColor(a.packageName),
			})),
		})),
	)

	// --- Computed: map android timeline sessions → TimelineSessionDto[] ---
	const primarySessions = computed<TimelineSessionDto[]>(
		() =>
			timelineRaw.value?.sessions.map(
				s =>
					new TimelineSessionDto(s.id, s.appLabel, s.startedAt, s.endedAt, s.durationSeconds, s.totalSeconds),
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

	// --- Fetch Functions ---
	async function fetchSummaryCards() {
		summaryCardsLoading.value = true
		try {
			summaryCardsRaw.value = await getAndroidSummaryCards(
				new AndroidSummaryCardsRequest(
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
			pieChartData.value = await getAndroidPieChart(
				new AndroidPieChartRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value, 1),
			)
		} finally {
			pieChartLoading.value = false
		}
	}

	async function fetchStackedBars() {
		stackedBarsLoading.value = true
		try {
			stackedBarsRaw.value = await getAndroidStackedBars(
				new AndroidStackedBarsRequest(
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
			timelineRaw.value = await getAndroidTimeline(
				new AndroidTimelineRequest(formatDateForApi(date.value), timeFrom.value, timeTo.value),
			)
		} finally {
			timelineLoading.value = false
		}
	}

	watch(
		[date, timeFrom, timeTo],
		() => {
			selectedAppLabel.value = null
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

	function handleAppSelect(appLabel: string) {
		selectedAppLabel.value = selectedAppLabel.value === appLabel ? null : appLabel
	}

	function handleWindowSizeChange(size: number) {
		selectedWindowSize.value = size
		fetchStackedBars()
	}

	function handleActivityClick(_window: StackedBarsInputWindow, name: string) {
		selectedAppLabel.value = selectedAppLabel.value === name ? null : name
	}

	function handleSessionClick(session: TimelineSessionDto) {
		selectedAppLabel.value = selectedAppLabel.value === session.domain ? null : session.domain
	}
</script>
