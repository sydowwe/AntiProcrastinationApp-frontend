<template>
	<div class="py-6 w-100 h-100 d-flex flex-column">
		<!-- Header -->
		<div class="mb-4 w-100 d-flex align-center ga-6 flex-wrap">
			<h1 class="text-h4">Activity History</h1>
			<HistoryDateRangeSelector
				v-model:date="date"
				v-model:rangeType="rangeType"
				v-model:endDate="endDate"
			/>
			<HistoryGroupBySelector v-model="groupBy" />
		</div>

		<!-- Body -->
		<div
			class="flex-fill d-flex flex-column ga-4"
			style="min-height: 0"
		>
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
			>
				<template #header-right>
					<TimeRangePicker
						v-model:start="windowStartTime"
						v-model:end="windowEndTime"
						class="flex-shrink-0"
						label="Day from"
						density="compact"
						hideDetails
						allowedMinutesSelected="30"
					/>
				</template>
			</StackedBarsChart>

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
					/>
				</VCol>
			</VRow>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
	import { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
	import { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
	import {
		getSummaryPieChart,
		getSummaryStackedBars,
		getSummarySummaryCards,
	} from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import HistoryDateRangeSelector from '@/core/historyDashboard/component/controls/HistoryDateRangeSelector.vue'
	import HistoryGroupBySelector from '@/core/historyDashboard/component/controls/HistoryGroupBySelector.vue'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import HistorySummaryCards from '@/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue'
	import HistoryPieChartSection from '@/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue'
	import { HistorySummaryStackedBarsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryStackedBarsRequest.ts'
	import { HistorySummaryPieChartRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryPieChartRequest.ts'
	import { HistorySummarySummaryCardsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummarySummaryCardsRequest.ts'
	import { parseWindowInstant, useHistoryDashboard } from '@/core/activityHistory/composable/useHistoryDashboard.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'

	const route = useRoute()
	const router = useRouter()

	// --- URL param init helpers ---
	function initRangeType(): ActivityDateRangeTypeEnum {
		const val = route.query.range as string
		return (Object.values(ActivityDateRangeTypeEnum) as string[]).includes(val)
			? (val as ActivityDateRangeTypeEnum)
			: ActivityDateRangeTypeEnum.Week
	}

	function initGroupBy(): HistoryGroupBy {
		const val = route.query.groupBy as string
		return (Object.values(HistoryGroupBy) as string[]).includes(val)
			? (val as HistoryGroupBy)
			: HistoryGroupBy.Activity
	}

	function serializeWindowSize(minutes: number): string {
		const t = Time.fromMinutes(minutes)
		if (t.hours === 0) return `${t.minutes}m`
		if (t.minutes === 0) return `${t.hours}h`
		return `${t.hours}h${t.minutes}m`
	}

	function parseWindowSize(val: string): number {
		const match = val.match(/^(?:(\d+)h)?(?:(\d+)m)?$/)
		if (!match) return 240
		const total = parseInt(match[1] ?? '0') * 60 + parseInt(match[2] ?? '0')
		return total > 0 ? total : 240
	}

	function initWindowSize(): number {
		const val = route.query.windowSize as string
		return val ? parseWindowSize(val) : 240
	}

	function initTime(param: string, fallback: Time): Time {
		const val = route.query[param] as string
		return val ? Time.fromString(val) : fallback
	}

	// --- State: the multi-day range this view asks its questions over ---
	const date = ref((route.query.date as string) || '')
	const rangeType = ref<ActivityDateRangeTypeEnum>(initRangeType())
	const endDate = ref<string | undefined>((route.query.endDate as string) || undefined)
	const groupBy = ref<HistoryGroupBy>(initGroupBy())
	const windowStartTime = ref(initTime('timeFrom', new Time(8, 0)))
	const windowEndTime = ref(initTime('timeTo', new Time(1, 0)))

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
		stackedBarsWindows,
		stackedBarsLoading,
		pieChartLoading,
		summaryCardsLoading,
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
		},
		{
			defaultBaseline: BaselineType.Last7Days,
			initialWindowSize: initWindowSize(),
			canFetch: () => date.value !== '',
		},
	)

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
				const start = new Date(date.value)
				const end = new Date(endDate.value)
				const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
				if (diffDays <= 7) return weekOptions
				if (diffDays <= 31) return [1, 2, 4, 8, 12, 24, 168]
				return [12, 24, 168, 336, 720]
			}
			default:
				return weekOptions
		}
	})
	const windowSizeOptionsMinutes = computed(() => windowSizeOptions.value.map(h => h * 60))

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

	// --- Sync state to URL ---
	watch([date, rangeType, endDate, groupBy, selectedWindowSize, windowStartTime, windowEndTime], () => {
		router.replace({
			query: {
				range: rangeType.value,
				date: date.value || undefined,
				endDate: endDate.value || undefined,
				groupBy: groupBy.value,
				windowSize: serializeWindowSize(selectedWindowSize.value),
				timeFrom: windowStartTime.value.getString(),
				timeTo: windowEndTime.value.getString(),
			},
		})
	})
</script>
