<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<ActivityDashboardHeader
			v-model:date="date"
			v-model:timeFrom="timeFrom"
			v-model:timeTo="timeTo"
			v-model:selectedVisualization="selectedVisualization"
			:title="$t('activityTracking.dashboard.desktopTitle')"
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
						:title="$t('activityTracking.dashboard.topProcesses')"
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
					<DesktopPieChartSection
						v-model:selectedProductName="selectedItem"
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
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import ActivityTimeline from '@/core/activityTracking/component/timeline/ActivityTimeline.vue'
	import ActivitySummaryCards from '@/core/activityTracking/component/summaryCards/ActivitySummaryCards.vue'
	import DesktopPieChartSection from '@/core/activityTracking/component/desktop/DesktopPieChartSection.vue'
	import ActivityDashboardHeader from '@/core/activityTracking/component/ActivityDashboardHeader.vue'
	import { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
	import { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput'
	import { getDomainColor } from '@/_common/utils/domainColor.ts'
	import {
		getDesktopPieChart,
		getDesktopStackedBars,
		getDesktopSummaryCards,
		getDesktopTimeline,
	} from '@/core/activityTracking/api/desktopActivityTrackingApi.ts'
	import { DesktopStackedBarsRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopStackedBarsRequest.ts'
	import { DesktopTimelineRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopTimelineRequest.ts'
	import { DesktopSummaryCardsRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopSummaryCardsRequest.ts'
	import { DesktopPieChartRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopPieChartRequest.ts'
	import type { DesktopStackedBarsWindow } from '@/core/activityTracking/dto/response/desktop/DesktopStackedBarsWindow.ts'
	import type { DesktopTimelineSession } from '@/core/activityTracking/dto/response/desktop/DesktopTimelineSession.ts'
	import type { DesktopProcessSummaryDto } from '@/core/activityTracking/dto/response/desktop/DesktopProcessSummaryDto.ts'
	import type { DesktopPieChartResponse } from '@/core/activityTracking/dto/response/desktop/DesktopPieChartResponse.ts'
	import {
		type ActivityDashboardFetchers,
		useActivityDashboard,
	} from '@/core/activityTracking/composable/useActivityDashboard.ts'

	// --- Response → view-model mapping ---
	function toSummaryCardsData(process: DesktopProcessSummaryDto): SummaryCardsData {
		return new SummaryCardsData(
			process.productName,
			process.active,
			process.background,
			(process.active?.seconds ?? 0) + (process.background?.seconds ?? 0),
			process.isNew,
		)
	}

	function toStackedBarsWindow(window: DesktopStackedBarsWindow): StackedBarsInputWindow {
		return {
			windowStart: window.windowStart,
			windowEnd: window.windowEnd,
			items: window.activities.map(a => ({
				name: a.productName,
				activeSeconds: a.activeSeconds,
				backgroundSeconds: a.backgroundSeconds,
				color: getDomainColor(a.processName),
			})),
		}
	}

	function toTimelineSession(session: DesktopTimelineSession): TimelineSessionDto {
		return new TimelineSessionDto(
			session.id,
			session.productName,
			session.startedAt,
			session.endedAt,
			session.durationSeconds,
			session.totalSeconds,
		)
	}

	const fetchers: ActivityDashboardFetchers<DesktopPieChartResponse> = {
		async fetchSummaryCards(range, baseline) {
			const processes = await getDesktopSummaryCards(
				new DesktopSummaryCardsRequest(range.date, range.timeFrom, range.timeTo, baseline, 4),
			)
			return processes.map(toSummaryCardsData)
		},
		fetchPieChart(range) {
			return getDesktopPieChart(new DesktopPieChartRequest(range.date, range.timeFrom, range.timeTo, 1))
		},
		async fetchStackedBars(range, windowSize) {
			const windows = await getDesktopStackedBars(
				new DesktopStackedBarsRequest(range.date, range.timeFrom, range.timeTo, windowSize),
			)
			return windows.map(toStackedBarsWindow)
		},
		async fetchTimeline(range) {
			const timeline = await getDesktopTimeline(
				new DesktopTimelineRequest(range.date, range.timeFrom, range.timeTo),
			)
			return {
				primarySessions: timeline.primarySessions.map(toTimelineSession),
				detailSessions: timeline.detailSessions.map(toTimelineSession),
				backgroundSessions: timeline.backgroundSessions.map(toTimelineSession),
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
