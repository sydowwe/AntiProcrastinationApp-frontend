<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<ActivityDashboardHeader
			v-model:date="date"
			v-model:timeFrom="timeFrom"
			v-model:timeTo="timeTo"
			v-model:selectedVisualization="selectedVisualization"
			:title="$t('activityTracking.dashboard.androidTitle')"
		/>

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
						:title="$t('activityTracking.dashboard.topApps')"
						:domains="summaryCardsData"
						:baselineOptions
						:selectedBaseline
						:selectedDomain="selectedItem"
						:loading="summaryCardsLoading"
						@update:selectedBaseline="handleBaselineChange"
						@domainClick="handleItemSelect"
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
		async fetchSummaryCards(range, baseline) {
			const apps = await getAndroidSummaryCards(
				new AndroidSummaryCardsRequest(range.date, range.timeFrom, range.timeTo, baseline, 4),
			)
			return apps.map(toSummaryCardsData)
		},
		fetchPieChart(range) {
			return getAndroidPieChart(new AndroidPieChartRequest(range.date, range.timeFrom, range.timeTo, 1))
		},
		async fetchStackedBars(range, windowSize) {
			const windows = await getAndroidStackedBars(
				new AndroidStackedBarsRequest(range.date, range.timeFrom, range.timeTo, windowSize),
			)
			return windows.map(toStackedBarsWindow)
		},
		async fetchTimeline(range) {
			const timeline = await getAndroidTimeline(
				new AndroidTimelineRequest(range.date, range.timeFrom, range.timeTo),
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
		date,
		timeFrom,
		timeTo,
		selectedItem,
		selectedBaseline,
		selectedVisualization,
		selectedWindowSize,
		activityWindowSizeOptions,
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
		handleBaselineChange,
		handleItemSelect,
		handleWindowSizeChange,
		handleActivityClick,
		handleSessionClick,
	} = useActivityDashboard(fetchers)
</script>
