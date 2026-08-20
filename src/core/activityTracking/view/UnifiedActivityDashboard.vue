<template>
	<div class="py-5 w-100 h-100 d-flex flex-column">
		<ActivityDashboardHeader
			v-model:timeFrom="timeFrom"
			v-model:timeTo="timeTo"
			v-model:selectedVisualization="selectedVisualization"
			:dateFrom
			:dateTo
			:isTimelineAvailable
			:title="$t('activityTracking.dashboard.unifiedTitle')"
			@changeDateSpan="setDateSpan"
		/>

		<ActivitySourceFilter
			v-model:sources="sources"
			class="mb-4"
			:breakdown
			:loading="breakdownLoading"
			:error="breakdownError"
			@retry="fetchBreakdown"
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
				:laneLabels
				@sessionClick="handleSessionClick"
				@retry="fetchTimeline"
			/>
		</div>

		<!-- Bottom Section: Summary Cards + Pie Chart -->
		<div class="mt-6">
			<ActivityFocusStrip
				class="mb-4"
				:metrics="focusMetrics"
				:loading="focusMetricsLoading"
				:error="focusMetricsError"
				@retry="fetchFocusMetrics"
			/>
			<VRow>
				<VCol
					cols="12"
					lg="7"
					class="pr-8 pb-3"
				>
					<ActivitySummaryCards
						:title="$t('activityTracking.dashboard.topItems')"
						:domains="summaryCardsData"
						:baselineOptions
						:selectedBaseline
						:selectedDomain="selectedItem"
						:loading="summaryCardsLoading"
						:error="summaryCardsError"
						:emptyProbeState
						:isRangeMode
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
					<UnifiedPieChartSection
						v-model:selectedItem="selectedItem"
						:items="pieChartData?.items ?? []"
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
	import { computed, ref, watch } from 'vue'
	import { useRoute } from 'vue-router'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import ActivityTimeline from '@/core/activityTracking/component/timeline/ActivityTimeline.vue'
	import ActivitySummaryCards from '@/core/activityTracking/component/summaryCards/ActivitySummaryCards.vue'
	import ActivityDashboardHeader from '@/core/activityTracking/component/ActivityDashboardHeader.vue'
	import ActivityFocusStrip from '@/core/activityTracking/component/focusMetrics/ActivityFocusStrip.vue'
	import ActivitySourceFilter from '@/core/activityTracking/component/unified/ActivitySourceFilter.vue'
	import UnifiedPieChartSection from '@/core/activityTracking/component/unified/UnifiedPieChartSection.vue'
	import { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/dto/StackedBarsInput.ts'
	import type { UnifiedStackedBarsWindow } from '@/core/activityTracking/dto/response/unified/UnifiedStackedBarsWindow.ts'
	import type { UnifiedSummaryItem } from '@/core/activityTracking/dto/response/unified/UnifiedSummaryItem.ts'
	import type { UnifiedPieChartResponse } from '@/core/activityTracking/dto/response/unified/UnifiedPieChartResponse.ts'
	import {
		ACTIVITY_SOURCE_ORDER,
		type ActivitySource,
		parseActivitySources,
	} from '@/core/activityTracking/dto/enum/ActivitySource.ts'
	import { UnifiedSummaryCardsRequest } from '@/core/activityTracking/dto/request/unified/UnifiedSummaryCardsRequest.ts'
	import { UnifiedPieChartRequest } from '@/core/activityTracking/dto/request/unified/UnifiedPieChartRequest.ts'
	import { UnifiedStackedBarsRequest } from '@/core/activityTracking/dto/request/unified/UnifiedStackedBarsRequest.ts'
	import { UnifiedTimelineRequest } from '@/core/activityTracking/dto/request/unified/UnifiedTimelineRequest.ts'
	import { UnifiedFocusMetricsRequest } from '@/core/activityTracking/dto/request/unified/UnifiedFocusMetricsRequest.ts'
	import {
		getUnifiedFocusMetrics,
		getUnifiedPieChart,
		getUnifiedStackedBars,
		getUnifiedSummaryCards,
		getUnifiedTimeline,
	} from '@/core/activityTracking/api/unifiedActivityTrackingApi.ts'
	import { FOCUS_BLOCK_TOLERANCE_SECONDS } from '@/core/activityTracking/composable/focusMetrics.ts'
	import { unifiedItemColor, useActivitySources } from '@/core/activityTracking/composable/useActivitySources.ts'
	import { useUnifiedSourceBreakdown } from '@/core/activityTracking/composable/useUnifiedSourceBreakdown.ts'
	import {
		type ActivityDashboardFetchers,
		useActivityDashboard,
	} from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const route = useRoute()
	const { sourceOptions } = useActivitySources()

	const SOURCES_PARAM = 'sources'

	/**
	 * Which trackers are merged. Seeded from the URL, defaulting to all three — the point of this view
	 * is the whole day, so an unqualified link opens on everything.
	 *
	 * This is a *request* field, not a display filter: turning the extension off has to give the
	 * browser minutes back to the desktop agent, which only the server can do. Every change therefore
	 * re-runs the round. See `UnifiedActivityRequest`.
	 */
	const sources = ref<ActivitySource[]>(seedSources())

	function seedSources(): ActivitySource[] {
		const raw = route.query[SOURCES_PARAM]
		const first = Array.isArray(raw) ? raw[0] : raw
		const parsed = typeof first === 'string' ? parseActivitySources(first.split(',')) : []
		return parsed.length > 0 ? parsed : [...ACTIVITY_SOURCE_ORDER]
	}

	// Omitted at its default so an "everything" link stays clean, and so adding a fourth source later
	// widens existing bookmarks instead of pinning them to today's three.
	const extraQuery = computed(() => ({
		[SOURCES_PARAM]: sources.value.length === ACTIVITY_SOURCE_ORDER.length ? undefined : sources.value.join(','),
	}))

	// --- Response → view-model mapping ---
	function toSummaryCardsData(item: UnifiedSummaryItem): SummaryCardsData {
		return new SummaryCardsData(item.label, item.active, item.background, item.totalSeconds, item.isNew)
	}

	function toStackedBarsWindow(window: UnifiedStackedBarsWindow): StackedBarsInputWindow {
		return {
			windowStart: window.windowStart,
			windowEnd: window.windowEnd,
			items: window.items.map(item => ({
				name: item.label,
				activeSeconds: item.activeSeconds,
				backgroundSeconds: item.backgroundSeconds,
				// The one colour entry point — the three per-source dashboards each feed a different
				// field here and would give one application two hues on this screen.
				color: unifiedItemColor(item.label),
			})),
		}
	}

	const fetchers: ActivityDashboardFetchers<UnifiedPieChartResponse> = {
		async fetchSummaryCards(range, baseline, signal) {
			const items = await getUnifiedSummaryCards(
				new UnifiedSummaryCardsRequest(
					range.dateFrom,
					range.dateTo,
					range.timeFrom,
					range.timeTo,
					sources.value,
					baseline,
					4,
				),
				signal,
			)
			return items.map(toSummaryCardsData)
		},
		fetchPieChart(range, signal) {
			return getUnifiedPieChart(
				new UnifiedPieChartRequest(
					range.dateFrom,
					range.dateTo,
					range.timeFrom,
					range.timeTo,
					sources.value,
					1,
				),
				signal,
			)
		},
		async fetchStackedBars(range, windowSize, signal) {
			const windows = await getUnifiedStackedBars(
				new UnifiedStackedBarsRequest(
					range.dateFrom,
					range.dateTo,
					range.timeFrom,
					range.timeTo,
					sources.value,
					windowSize,
				),
				signal,
			)
			return windows.map(toStackedBarsWindow)
		},
		async fetchTimeline(range, signal) {
			const timeline = await getUnifiedTimeline(
				new UnifiedTimelineRequest(range.dateFrom, range.dateTo, range.timeFrom, range.timeTo, sources.value),
				signal,
			)
			// Lanes are sources, top to bottom in `ACTIVITY_SOURCE_ORDER` — the same order the filter
			// chips and the overlap note use, so "the extension took precedence over the desktop agent"
			// reads down the chart. Positions are fixed whether or not a source is selected; a
			// deselected one simply has no sessions.
			return {
				primarySessions: timeline.webExtensionSessions,
				detailSessions: timeline.desktopSessions,
				backgroundSessions: timeline.androidSessions,
			}
		},
		fetchFocusMetrics(range, baseline, signal) {
			return getUnifiedFocusMetrics(
				new UnifiedFocusMetricsRequest(
					range.dateFrom,
					range.dateTo,
					range.timeFrom,
					range.timeTo,
					sources.value,
					baseline,
					FOCUS_BLOCK_TOLERANCE_SECONDS,
				),
				signal,
			)
		},
	}

	const {
		dateFrom,
		dateTo,
		timeFrom,
		timeTo,
		range,
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
		focusMetrics,
		timelineFrom,
		timelineTo,
		summaryCardsLoading,
		pieChartLoading,
		stackedBarsLoading,
		timelineLoading,
		focusMetricsLoading,
		summaryCardsError,
		pieChartError,
		stackedBarsError,
		timelineError,
		focusMetricsError,
		emptyProbeState,
		fetchSummaryCards,
		fetchPieChart,
		fetchStackedBars,
		fetchTimeline,
		fetchFocusMetrics,
		runRound,
		setDateSpan,
		handleBaselineChange,
		handleItemSelect,
		handleWindowSizeChange,
		handleActivityClick,
		handleSessionClick,
		widenToFullDay,
	} = useActivityDashboard(fetchers, { extraQuery })

	const { breakdown, breakdownLoading, breakdownError, fetchBreakdown } = useUnifiedSourceBreakdown(range, sources)

	const laneLabels = computed(() => sourceOptions.value.map(option => option.label))

	// Not debounced, unlike the date and time watchers in the composable: chips are discrete clicks,
	// not a scrub. `runRound` clears the selection on the way through, which is what we want — the
	// selected item may not exist in the new merge.
	watch(sources, () => {
		runRound()
	})
</script>
