<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<ActivityDashboardHeader
			v-model:date="date"
			v-model:timeFrom="timeFrom"
			v-model:timeTo="timeTo"
			v-model:selectedVisualization="selectedVisualization"
			:title="$t('activityTracking.dashboard.title')"
		/>

		<!-- Visualization Content -->
		<div class="flex-fill">
			<StackedBarsChart
				v-if="selectedVisualization === 'stackedBars'"
				class="w-100"
				:windows="stackedBarsWindows"
				:loading="stackedBarsLoading"
				:error="stackedBarsError"
				:initialWindowSize="selectedWindowSize"
				:timeFrom
				:timeTo
				:windowSizeOptions="activityWindowSizeOptions"
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

		<!-- Top Section: Summary Cards + Pie Chart -->
		<div class="mt-6">
			<VRow>
				<VCol
					cols="12"
					lg="7"
					class="pr-8 pb-3"
				>
					<ActivitySummaryCards
						:domains="summaryCardsData"
						:baselineOptions
						:selectedBaseline
						:selectedDomain="selectedItem"
						:loading="summaryCardsLoading"
						:error="summaryCardsError"
						:emptyProbeState
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
					<ActivityPieChartSection
						v-model:selectedDomain="selectedItem"
						:domains="pieChartData?.domains ?? []"
						:dayTotals="pieChartData?.totals"
						:loading="pieChartLoading"
						:error="pieChartError"
						:emptyProbeState
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
	import ActivityPieChartSection from '@/core/activityTracking/component/pieChart/ActivityPieChartSection.vue'
	import ActivityDashboardHeader from '@/core/activityTracking/component/ActivityDashboardHeader.vue'
	import type { ActivityWindow } from '@/core/activityTracking/dto/response/stackedBars/ActivityWindow.ts'
	import type { PieChartData } from '@/core/activityTracking/dto/response/pieChart/PieChartData.ts'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput'
	import {
		getPieChart,
		getStackedBarsData,
		getSummaryCards,
		getTimeline,
	} from '@/core/activityTracking/api/activityTrackingApi'
	import { SummaryCardsRequest } from '@/core/activityTracking/dto/request/SummaryCardsRequest.ts'
	import { PieChartRequest } from '@/core/activityTracking/dto/request/PieChartRequest.ts'
	import { StackedBarsRequest } from '@/core/activityTracking/dto/request/StackedBarsRequest.ts'
	import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import {
		type ActivityDashboardFetchers,
		useActivityDashboard,
	} from '@/core/activityTracking/composable/useActivityDashboard.ts'

	// --- Response → view-model mapping ---
	function toStackedBarsWindow(window: ActivityWindow): StackedBarsInputWindow {
		return {
			windowStart: window.windowStart,
			windowEnd: window.windowEnd,
			items: window.activities.map(a => ({
				name: a.domain,
				activeSeconds: a.activeSeconds,
				backgroundSeconds: a.backgroundSeconds,
				color: getDomainColor(a.domain),
				url: a.url,
			})),
		}
	}

	const fetchers: ActivityDashboardFetchers<PieChartData> = {
		fetchSummaryCards(range, baseline, signal) {
			return getSummaryCards(
				new SummaryCardsRequest(range.date, range.timeFrom, range.timeTo, baseline, 4),
				signal,
			)
		},
		fetchPieChart(range, signal) {
			return getPieChart(new PieChartRequest(range.date, range.timeFrom, range.timeTo, 1), signal)
		},
		async fetchStackedBars(range, windowSize, signal) {
			const windows = await getStackedBarsData(
				new StackedBarsRequest(range.date, range.timeFrom, range.timeTo, windowSize),
				signal,
			)
			return windows.map(toStackedBarsWindow)
		},
		async fetchTimeline(range, signal) {
			const timeline = await getTimeline(
				new DateAndTimeRangeRequest(range.date, range.timeFrom, range.timeTo),
				signal,
			)
			return {
				primarySessions: timeline.primarySessions,
				detailSessions: timeline.detailSessions,
				backgroundSessions: timeline.backgroundSessions,
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
		summaryCardsError,
		pieChartError,
		stackedBarsError,
		timelineError,
		emptyProbeState,
		fetchSummaryCards,
		fetchPieChart,
		fetchStackedBars,
		fetchTimeline,
		handleBaselineChange,
		handleItemSelect,
		handleWindowSizeChange,
		handleActivityClick,
		handleSessionClick,
		widenToFullDay,
	} = useActivityDashboard(fetchers)
</script>
