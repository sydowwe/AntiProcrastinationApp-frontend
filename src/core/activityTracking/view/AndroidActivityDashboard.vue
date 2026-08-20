<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<ActivityDashboardHeader
			v-model:timeFrom="timeFrom"
			v-model:timeTo="timeTo"
			v-model:selectedVisualization="selectedVisualization"
			:dateFrom
			:dateTo
			:isTimelineAvailable
			:title="$t('activityTracking.dashboard.androidTitle')"
			@changeDateSpan="setDateSpan"
		/>

		<!-- Visualization Content -->
		<div class="flex-fill">
			<StackedBarsChart
				v-if="effectiveVisualization === 'stackedBars'"
				class="w-100"
				:windows="stackedBarsWindows"
				:loading="stackedBarsLoading"
				:error="stackedBarsError"
				:initialWindowSize="selectedWindowSize"
				:timeFrom
				:timeTo
				:windowSizeOptions
				@windowSizeChange="handleWindowSizeChange"
				@activityClick="handleActivityClick"
				@retry="fetchStackedBars"
			/>
			<ActivityTimeline
				v-else
				:primarySessions
				:detailSessions
				:backgroundSessions
				:from="timelineFrom"
				:to="timelineTo"
				:loading="timelineLoading"
				:error="timelineError"
				@sessionClick="handleSessionClick"
				@retry="fetchTimeline"
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
						:title="$t('activityTracking.dashboard.topApps')"
						:domains="summaryCardsData"
						:baselineOptions
						:selectedBaseline
						:selectedDomain="selectedItem"
						:loading="summaryCardsLoading"
						:error="summaryCardsError"
						:emptyProbeState
						:isRangeMode
						settingsRouteName="androidSettings"
						@update:selectedBaseline="handleBaselineChange"
						@domainClick="handleItemSelect"
						@retry="fetchSummaryCards"
						@widenWindow="widenToFullDay"
					/>
				</VCol>
				<VCol
					cols="12"
					lg="5"
					class="pb-3"
				>
					<AndroidPieChartSection
						v-model:selectedAppLabel="selectedItem"
						:apps="pieChartData?.apps ?? []"
						:totals="pieChartData?.totals"
						:loading="pieChartLoading"
						:error="pieChartError"
						:emptyProbeState
						:isRangeMode
						@retry="fetchPieChart"
						@widenWindow="widenToFullDay"
					/>
				</VCol>
			</VRow>
		</div>
	</div>
</template>

<script setup lang="ts">
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import ActivityTimeline from '@/core/activityTracking/component/timeline/ActivityTimeline.vue'
	import ActivitySummaryCards from '@/core/activityTracking/component/summaryCards/ActivitySummaryCards.vue'
	import AndroidPieChartSection from '@/core/activityTracking/component/android/AndroidPieChartSection.vue'
	import ActivityDashboardHeader from '@/core/activityTracking/component/ActivityDashboardHeader.vue'
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
	import type { AndroidTimelineSession } from '@/core/activityTracking/dto/response/android/AndroidTimelineSession.ts'
	import type { AndroidAppSummaryDto } from '@/core/activityTracking/dto/response/android/AndroidAppSummaryDto.ts'
	import type { AndroidPieChartResponse } from '@/core/activityTracking/dto/response/android/AndroidPieChartResponse.ts'
	import {
		type ActivityDashboardFetchers,
		useActivityDashboard,
	} from '@/core/activityTracking/composable/useActivityDashboard.ts'

	// --- Response → view-model mapping ---
	function toSummaryCardsData(app: AndroidAppSummaryDto): SummaryCardsData {
		return new SummaryCardsData(app.appLabel, app.stat, null, app.stat?.seconds ?? 0, app.isNew)
	}

	function toStackedBarsWindow(window: AndroidStackedBarsWindow): StackedBarsInputWindow {
		return {
			windowStart: window.windowStart,
			windowEnd: window.windowEnd,
			items: window.apps.map(a => ({
				name: a.appLabel,
				activeSeconds: a.seconds,
				backgroundSeconds: 0,
				color: getDomainColor(a.packageName),
			})),
		}
	}

	function toTimelineSession(session: AndroidTimelineSession): TimelineSessionDto {
		return new TimelineSessionDto(
			session.id,
			session.appLabel,
			session.startedAt,
			session.endedAt,
			session.durationSeconds,
			session.totalSeconds,
		)
	}

	const fetchers: ActivityDashboardFetchers<AndroidPieChartResponse> = {
		async fetchSummaryCards(range, baseline, signal) {
			const apps = await getAndroidSummaryCards(
				new AndroidSummaryCardsRequest(range.dateFrom, range.dateTo, range.timeFrom, range.timeTo, baseline, 4),
				signal,
			)
			return apps.map(toSummaryCardsData)
		},
		fetchPieChart(range, signal) {
			return getAndroidPieChart(
				new AndroidPieChartRequest(range.dateFrom, range.dateTo, range.timeFrom, range.timeTo, 1),
				signal,
			)
		},
		async fetchStackedBars(range, windowSize, signal) {
			const windows = await getAndroidStackedBars(
				new AndroidStackedBarsRequest(range.dateFrom, range.dateTo, range.timeFrom, range.timeTo, windowSize),
				signal,
			)
			return windows.map(toStackedBarsWindow)
		},
		async fetchTimeline(range, signal) {
			const timeline = await getAndroidTimeline(
				new AndroidTimelineRequest(range.dateFrom, range.dateTo, range.timeFrom, range.timeTo),
				signal,
			)
			// Android reports a single lane — it has no detail or background sessions.
			return {
				primarySessions: timeline.sessions.map(toTimelineSession),
				detailSessions: [],
				backgroundSessions: [],
			}
		},
	}

	const {
		dateFrom,
		dateTo,
		timeFrom,
		timeTo,
		isRangeMode,
		isTimelineAvailable,
		selectedItem,
		selectedBaseline,
		selectedVisualization,
		effectiveVisualization,
		selectedWindowSize,
		windowSizeOptions,
		baselineOptions,
		summaryCardsData,
		pieChartData,
		stackedBarsWindows,
		primarySessions,
		detailSessions,
		backgroundSessions,
		timelineFrom,
		timelineTo,
		summaryCardsLoading,
		pieChartLoading,
		stackedBarsLoading,
		timelineLoading,
		summaryCardsError,
		pieChartError,
		stackedBarsError,
		timelineError,
		emptyProbeState,
		fetchSummaryCards,
		fetchPieChart,
		fetchStackedBars,
		fetchTimeline,
		setDateSpan,
		handleBaselineChange,
		handleItemSelect,
		handleWindowSizeChange,
		handleActivityClick,
		handleSessionClick,
		widenToFullDay,
	} = useActivityDashboard(fetchers)
</script>
