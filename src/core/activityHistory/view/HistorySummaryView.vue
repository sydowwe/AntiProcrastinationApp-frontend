<template>
	<div class="py-6 w-100 h-100 d-flex flex-column">
		<!-- Header -->
		<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
			<VIconBtn
				icon="calendar-days"
				variant="tonal"
				style="margin-right: -12px"
				@click="router.push({ name: 'activityHistoryCalendar' })"
			>
				<VTooltip
					activator="parent"
					location="bottom"
				>
					{{ $t('history.summary.openCalendar') }}
				</VTooltip>
			</VIconBtn>
			<h1 class="text-h4">{{ $t('history.summary.title') }}</h1>
			<HistoryDateRangeSelector
				v-model:date="date"
				v-model:rangeType="rangeType"
				v-model:endDate="endDate"
			/>
			<HistoryGroupBySelector v-model="groupBy" />
			<ExportMenu
				class="ml-auto"
				:loading="exporting"
				@export="exportSummary"
			/>
		</div>

		<!-- Body -->
		<div
			class="flex-fill d-flex flex-column ga-4"
			style="min-height: 0"
		>
			<!-- First run: never recorded anything, anywhere — one onboarding block instead of three
			     empty charts (H7). -->
			<HistoryFirstRunState v-if="hasAnyHistoryEver === false" />

			<template v-else>
				<!-- Stacked Bars -->
				<StackedBarsChart
					class="flex-fill"
					style="min-height: 200px"
					:windows="stackedBarsWindows"
					:loading="stackedBarsLoading"
					:timeFrom="chartTimeFrom"
					:timeTo="chartTimeTo"
					:windowSizeOptions="windowSizeOptionsMinutes"
					:initialWindowSize="selectedWindowSize"
					@windowSizeChange="handleWindowSizeChange"
					@activityClick="handleActivityClick"
				>
					<template #header-right>
						<TimeRangePicker
							v-model:start="windowStartTime"
							v-model:end="windowEndTime"
							class="flex-shrink-0"
							:label="$t('history.summary.dayFrom')"
							density="compact"
							hideDetails
							allowedMinutesSelected="30"
						/>
					</template>
				</StackedBarsChart>

				<!-- Insights (H10): the few conclusions the three panels below do not state. Three come out of
				     the pie-chart response the view already holds; the time-of-day one is the only reason
				     this view fires a fourth request. -->
				<HistoryInsights
					class="flex-shrink-0"
					:data="pieChartData"
					:timeOfDay="timeOfDayData"
					:loading="pieChartLoading || timeOfDayLoading"
				/>

				<!-- Summary Cards + Pie Chart -->
				<VRow class="flex-shrink-0 flex-grow-0">
					<VCol
						cols="12"
						lg="6"
						class="pr-lg-8 pb-3"
					>
						<HistorySummaryCards
							class="h-100"
							:data="summaryCardsData"
							:groupBy="groupBy"
							:selectedGroup="selectedGroup"
							:selectedBaseline="selectedBaseline"
							:topN="topN"
							:loading="summaryCardsLoading"
							:periodLabel
							@update:selectedBaseline="handleBaselineChange"
							@update:topN="handleTopNChange"
							@groupClick="handleGroupSelect"
						/>
					</VCol>
					<VCol
						cols="12"
						lg="6"
						class="pb-3"
					>
						<HistoryPieChartSection
							v-model:selectedGroup="selectedGroup"
							:data="pieChartData"
							:loading="pieChartLoading"
							:periodLabel
						/>
					</VCol>
				</VRow>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
	import { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
	import { inclusiveDaySpan } from '@/core/historyDashboard/dto/request/customRange.ts'
	import { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
	import {
		getSummaryPieChart,
		getSummaryStackedBars,
		getSummarySummaryCards,
		getSummaryTimeOfDay,
	} from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import HistoryDateRangeSelector from '@/core/historyDashboard/component/controls/HistoryDateRangeSelector.vue'
	import HistoryGroupBySelector from '@/core/historyDashboard/component/controls/HistoryGroupBySelector.vue'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import HistorySummaryCards from '@/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue'
	import HistoryPieChartSection from '@/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue'
	import HistoryFirstRunState from '@/core/historyDashboard/component/HistoryFirstRunState.vue'
	import HistoryInsights from '@/core/historyDashboard/component/insights/HistoryInsights.vue'
	import ExportMenu from '@/_common/component/ExportMenu.vue'
	import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
	import { HistorySummaryStackedBarsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryStackedBarsRequest.ts'
	import { HistorySummaryPieChartRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryPieChartRequest.ts'
	import { HistorySummarySummaryCardsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummarySummaryCardsRequest.ts'
	import { HistorySummaryTimeOfDayRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryTimeOfDayRequest.ts'
	import {
		DEFAULT_TOP_N,
		parseWindowInstant,
		useHistoryDashboard,
	} from '@/core/activityHistory/composable/useHistoryDashboard.ts'
	import {
		parseEnumParam,
		parseTimeParam,
		parseTopN,
		parseWindowSize,
		sharedHistoryQueryParams,
	} from '@/core/activityHistory/composable/historyUrlParams.ts'
	import { useHistoryUrlSync } from '@/core/activityHistory/composable/useHistoryUrlSync.ts'
	import {
		buildCsv,
		buildExportFileName,
		EXPORT_GROUP_LIMIT,
		mergeGroupExportRows,
		useCsvExport,
		type HistoryGroupExportRow,
	} from '@/core/activityHistory/composable/useHistoryExport.ts'
	import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { formatToDate } from '@/_common/utils/DateTimeHelper.ts'
	import { fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/dto/StackedBarsInput.ts'

	const route = useRoute()
	const router = useRouter()
	const i18n = useI18n()

	// --- State: the multi-day range this view asks its questions over ---
	const date = ref((route.query.date as string) || '')
	const rangeType = ref<ActivityDateRangeTypeEnum>(
		parseEnumParam(route.query.range, Object.values(ActivityDateRangeTypeEnum), ActivityDateRangeTypeEnum.Week),
	)
	const endDate = ref<string | undefined>((route.query.endDate as string) || undefined)
	const groupBy = ref<HistoryGroupBy>(
		parseEnumParam(route.query.groupBy, Object.values(HistoryGroupBy), HistoryGroupBy.Activity),
	)
	const windowStartTime = ref(parseTimeParam(route.query.timeFrom, new Time(8, 0)))
	const windowEndTime = ref(parseTimeParam(route.query.timeTo, new Time(1, 0)))

	// --- Shared dashboard machinery ---
	// Everything range-shaped stays here in the fetchers; the composable never names a `HistorySummary*`
	// request class. `windowStartTime`/`windowEndTime` are user-zone wall clocks and are sent as-is —
	// B3 confirmed no client-side UTC conversion, for this endpoint and its `detail/` sibling alike.
	const {
		selectedGroup,
		selectedBaseline,
		topN,
		selectedWindowSize,
		stackedBarsData,
		pieChartData,
		summaryCardsData,
		timeOfDayData,
		stackedBarsWindows,
		stackedBarsLoading,
		pieChartLoading,
		summaryCardsLoading,
		timeOfDayLoading,
		hasAnyHistoryEver,
		fetchStackedBars,
		fetchAll,
		handleBaselineChange,
		handleTopNChange,
		handleGroupSelect,
		handleWindowSizeChange,
	} = useHistoryDashboard(
		{
			fetchStackedBars(windowSize) {
				return getSummaryStackedBars(
					new HistorySummaryStackedBarsRequest(
						date.value,
						rangeType.value,
						windowSize,
						windowStartTime.value,
						windowEndTime.value,
						endDate.value,
						groupBy.value,
					),
				)
			},
			fetchPieChart() {
				return getSummaryPieChart(
					new HistorySummaryPieChartRequest(groupBy.value, 20, date.value, rangeType.value, endDate.value),
				)
			},
			fetchSummaryCards(baseline, topNValue) {
				return getSummarySummaryCards(
					new HistorySummarySummaryCardsRequest(
						date.value,
						rangeType.value,
						groupBy.value,
						baseline,
						topNValue,
						endDate.value,
					),
				)
			},
			fetchTimeOfDay() {
				return getSummaryTimeOfDay(
					new HistorySummaryTimeOfDayRequest(date.value, rangeType.value, endDate.value),
				)
			},
		},
		{
			defaultBaseline: BaselineType.Last7Days,
			initialWindowSize: parseWindowSize(route.query.windowSize, 240),
			initialBaseline: parseEnumParam(route.query.baseline, Object.values(BaselineType), BaselineType.Last7Days),
			initialTopN: parseTopN(route.query.topN, DEFAULT_TOP_N),
			canFetch: () => date.value !== '',
		},
	)

	// --- Export (H8) ---
	// Reflects exactly the current date/range/groupBy/baseline. The on-screen pie chart and summary
	// cards are capped (20 items / topN) to stay readable — this refetches both, uncapped, so the
	// export is never a silent truncation of what the widgets show.
	const { exporting, exportCsv } = useCsvExport()

	function exportSummary(format: ExportFormat) {
		return exportCsv(format, async () => {
			if (date.value === '') return undefined
			const [pieChart, summaryCards] = await Promise.all([
				getSummaryPieChart(
					new HistorySummaryPieChartRequest(
						groupBy.value,
						EXPORT_GROUP_LIMIT,
						date.value,
						rangeType.value,
						endDate.value,
					),
				),
				getSummarySummaryCards(
					new HistorySummarySummaryCardsRequest(
						date.value,
						rangeType.value,
						groupBy.value,
						selectedBaseline.value,
						EXPORT_GROUP_LIMIT,
						endDate.value,
					),
				),
			])
			const csv = buildCsv<HistoryGroupExportRow>(
				[
					{ header: i18n.t('historyDashboard.export.summary.columns.groupName'), value: r => r.name },
					{
						header: i18n.t('historyDashboard.export.summary.columns.totalSeconds'),
						value: r => r.totalSeconds,
					},
					{
						header: i18n.t('historyDashboard.export.summary.columns.totalDuration'),
						value: r => fromSecondsDetailed(r.totalSeconds),
					},
					{ header: i18n.t('historyDashboard.export.summary.columns.entries'), value: r => r.entries },
					{
						header: i18n.t('historyDashboard.export.summary.columns.percentChange'),
						value: r => r.percentChange ?? '',
					},
				],
				mergeGroupExportRows(pieChart.items, summaryCards.cards),
			)
			return {
				csv,
				fileName: buildExportFileName([
					i18n.t('historyDashboard.export.summary.fileNamePrefix'),
					rangeType.value,
					date.value,
					endDate.value,
					groupBy.value,
				]),
			}
		})
	}

	// --- Window size options based on range type ---
	const weekOptions = [1, 2, 3, 4, 5, 8, 10, 12, 16]

	const windowSizeOptions = computed(() => {
		switch (rangeType.value) {
			case ActivityDateRangeTypeEnum.ThreeDays:
				return [0.5, 1, 2, 3, 4, 6, 8, 10, 12]
			case ActivityDateRangeTypeEnum.Week:
				return weekOptions
			case ActivityDateRangeTypeEnum.TwoWeeks:
				return [2, 3, 4, 5, 6, 8, 10, 12, 16, 48]
			case ActivityDateRangeTypeEnum.Month:
				return [4, 6, 8, 10, 12, 24, 48, 72, 168]
			case ActivityDateRangeTypeEnum.ThreeMonths:
				return [6, 8, 10, 12, 24, 72, 168, 336]
			case ActivityDateRangeTypeEnum.Year:
				return [24, 48, 72, 168, 336, 720]
			case ActivityDateRangeTypeEnum.CustomRange: {
				if (!date.value || !endDate.value) return weekOptions
				// Inclusive, matching the wire contract (B3 §2): 1–31 March is 31 days, not 30.
				const diffDays = Math.max(1, inclusiveDaySpan(new Date(date.value), new Date(endDate.value)))
				if (diffDays <= 7) return weekOptions
				if (diffDays <= 31) return [1, 2, 4, 8, 12, 24, 168]
				return [12, 24, 168, 336, 720]
			}
			default:
				return weekOptions
		}
	})
	const windowSizeOptionsMinutes = computed(() => windowSizeOptions.value.map(h => h * 60))

	// --- Empty-state period label (H7): names the range an empty result came back for, so a user who
	// lands on a window with no data can tell it apart from data having been lost. Only the bound the
	// backend's range-type semantics leave unambiguous is shown — the start date always, the end date
	// only when the user picked it explicitly (custom range).
	const periodLabel = computed(() => {
		if (!date.value) return undefined
		const start = formatToDate(new Date(date.value))
		if (!endDate.value) return start
		return `${start} – ${formatToDate(new Date(endDate.value))}`
	})

	// --- Time from/to for chart: derived from stacked bars response ---
	// `windowStart`/`windowEnd` are instants (B3 confirmed: the server always sends a `Z`-qualified
	// UTC timestamp here), so the wall-clock hour they display has to be read in the user's zone.
	const chartTimeFrom = computed(() => {
		if (!stackedBarsData.value || stackedBarsData.value.windows.length === 0) return new Time(0, 0)
		const first = stackedBarsData.value.windows[0]!
		return timeInUserZone(parseWindowInstant(first.windowStart))
	})

	const chartTimeTo = computed(() => {
		if (!stackedBarsData.value || stackedBarsData.value.windows.length === 0) return new Time(23, 59)
		const last = stackedBarsData.value.windows[stackedBarsData.value.windows.length - 1]!
		return timeInUserZone(parseWindowInstant(last.windowEnd))
	})

	watch([date, rangeType, endDate, groupBy], () => fetchAll(), { immediate: true })
	watch([windowStartTime, windowEndTime], () => fetchStackedBars())

	// --- Drill-through: clicking a bar opens the detail view for the day that window starts on. ---
	// `window.windowStart` is a UTC instant (see parseWindowInstant); read the calendar day it falls on
	// in the user's zone, not the browser's, so the two agree with the rest of the dashboard's clock.
	function handleActivityClick(window: StackedBarsInputWindow) {
		router.push({
			name: 'activityHistoryDetail',
			query: { date: isoDateInUserZone(window.windowStart), groupBy: groupBy.value },
		})
	}

	// --- Sync state to URL ---
	useHistoryUrlSync(
		[date, rangeType, endDate, groupBy, selectedWindowSize, windowStartTime, windowEndTime, selectedBaseline, topN],
		() => ({
			range: rangeType.value,
			date: date.value || undefined,
			endDate: endDate.value || undefined,
			...sharedHistoryQueryParams({
				groupBy: groupBy.value,
				windowSize: selectedWindowSize.value,
				timeFrom: windowStartTime.value,
				timeTo: windowEndTime.value,
				baseline: selectedBaseline.value,
				topN: topN.value,
			}),
		}),
	)
</script>
