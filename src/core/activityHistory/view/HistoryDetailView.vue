<template>
	<div class="px-2 py-6 w-100 h-100 d-flex flex-column">
		<!-- Header -->
		<div class="w-100 d-flex align-center ga-6 flex-wrap">
			<VIconBtn
				icon="calendar-days"
				variant="tonal"
				style="margin-right: -12px"
				@click="router.push({ name: 'activityHistoryCalendar' })"
			></VIconBtn>
			<h1 class="text-h4">{{ $t('history.detail.title') }}</h1>
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
					{{ $t('activityTracking.tracker.stackedBars') }}
				</VBtn>
				<VBtn
					value="timeline"
					height="40px"
				>
					{{ $t('activityTracking.tracker.timeline') }}
				</VBtn>
			</VBtnToggle>
			<div class="d-flex align-center ga-4 flex-wrap">
				<MyDateInput
					v-model="dateModel"
					:label="$t('dateTime.date')"
					hideDetails
					:max="today"
					density="compact"
				/>
				<TimeRangePicker
					v-model:start="timeFrom"
					v-model:end="timeTo"
					density="compact"
					hideDetails
				></TimeRangePicker>
			</div>
			<HistoryGroupBySelector v-model="groupBy" />
		</div>

		<!-- Visualization Toggle -->
		<div
			v-if="isStackedBars"
			class="flex-fill"
			style="min-height: 200px"
		>
			<StackedBarsChart
				class="w-100"
				:windows="stackedBarsWindows"
				:loading="stackedBarsLoading"
				:timeFrom
				:timeTo
				:windowSizeOptions="windowSizeOptions"
				:initialWindowSize="selectedWindowSize"
				@windowSizeChange="handleWindowSizeChange"
			/>
		</div>

		<!-- Summary Cards + Pie Chart -->
		<div
			v-if="isStackedBars"
			class="mt-6"
		>
			<VRow>
				<VCol
					cols="12"
					lg="6"
					class="pr-lg-8 pb-3"
				>
					<HistorySummaryCards
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

		<!-- Timeline + Context Panel -->
		<VRow
			v-if="!isStackedBars"
			class="flex-fill mt-0"
			style="min-height: 0"
		>
			<VCol
				cols="12"
				lg="7"
				class="d-flex flex-column overflow-hidden h-100"
			>
				<HistoryTimeline
					:date="date"
					:timeFrom
					:timeTo
					singleColumn
				/>
			</VCol>
			<VCol
				cols="12"
				lg="5"
				class="d-flex flex-column ga-4 overflow-y-auto"
			>
				<HistoryPieChartSection
					v-model:selectedGroup="selectedGroup"
					:data="pieChartData"
					:loading="pieChartLoading"
				/>
				<HistorySummaryCards
					:data="summaryCardsData"
					:groupBy
					:selectedGroup
					:selectedBaseline
					:topN
					:loading="summaryCardsLoading"
					@update:selectedBaseline="handleBaselineChange"
					@update:topN="handleTopNChange"
					@groupClick="handleGroupSelect"
				/>
			</VCol>
		</VRow>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
	import { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
	import { DetailStackedBarsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailStackedBarsRequest.ts'
	import { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
	import { DetailSummaryCardsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailSummaryCardsRequest.ts'
	import {
		getDetailPieChart,
		getDetailStackedBars,
		getDetailSummaryCards,
	} from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import type { HistoryWindow } from '@/core/historyDashboard/dto/response/HistoryWindow.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import HistoryGroupBySelector from '@/core/historyDashboard/component/controls/HistoryGroupBySelector.vue'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import HistorySummaryCards from '@/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue'
	import HistoryPieChartSection from '@/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue'
	import HistoryTimeline from '@/core/historyDashboard/component/HistoryTimeline.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { parseWindowInstant, useHistoryDashboard } from '@/core/activityHistory/composable/useHistoryDashboard.ts'

	const route = useRoute()
	const router = useRouter()

	// --- State: the single day and time-of-day window this view asks its questions over ---
	const today = new Date()
	const dateModel = ref<Date>(route.query.date ? new Date(route.query.date as string) : new Date())
	const timeFrom = ref(new Time(8, 0))
	const timeTo = ref(new Time(23, 59))
	const groupBy = ref<HistoryGroupBy>(HistoryGroupBy.Activity)
	const selectedVisualization = ref<'stackedBars' | 'timeline'>('timeline')

	const isStackedBars = computed(() => selectedVisualization.value === 'stackedBars')
	// --- Window size options for single day ---
	const windowSizeOptions = [15, 20, 30, 60]

	const date = computed(() => formatDateForApi(dateModel.value))

	/**
	 * B2 §4: `detail/stacked-bars` emits exactly 24 one-hour windows starting at the range's `from` and
	 * ignores `to` entirely, so a requested 08:00–16:00 comes back as 24 bars — 16 of them empty and
	 * extending past the requested end. Flagged as a backend bug; until it is fixed, clamp here rather
	 * than render the phantom tail as if it were the requested range.
	 *
	 * Clamping is done against the first window's start (which the backend does honour) plus the
	 * requested duration, so it holds whatever window size the server actually used.
	 *
	 * This is the one piece of the stacked-bars pipeline the summary view has no equivalent of, which is
	 * why the shared composable takes it as `selectWindows` rather than owning it.
	 */
	const requestedDurationMinutes = computed(() => {
		const span = (timeTo.value.getInMinutes - timeFrom.value.getInMinutes + 1440) % 1440
		return span === 0 ? 1440 : span
	})

	function clampWindowsToRequestedRange(windows: HistoryWindow[]): HistoryWindow[] {
		const first = windows[0]
		if (!first) return []
		const cutoff = parseWindowInstant(first.windowStart).getTime() + requestedDurationMinutes.value * 60_000
		return windows.filter(w => parseWindowInstant(w.windowStart).getTime() < cutoff)
	}

	// --- Shared dashboard machinery ---
	// Everything single-day-shaped stays here in the fetchers; the composable never names a `Detail*`
	// request class.
	const {
		selectedGroup,
		selectedBaseline,
		topN,
		selectedWindowSize,
		pieChartData,
		summaryCardsData,
		stackedBarsWindows,
		stackedBarsLoading,
		pieChartLoading,
		summaryCardsLoading,
		fetchAll,
		handleBaselineChange,
		handleTopNChange,
		handleGroupSelect,
		handleWindowSizeChange,
	} = useHistoryDashboard(
		{
			fetchStackedBars(windowSize) {
				return getDetailStackedBars(
					new DetailStackedBarsRequest(date.value, timeFrom.value, timeTo.value, windowSize, groupBy.value),
				)
			},
			fetchPieChart() {
				return getDetailPieChart(
					new DetailPieChartRequest(groupBy.value, 20, date.value, timeFrom.value, timeTo.value),
				)
			},
			fetchSummaryCards(baseline, topNValue) {
				return getDetailSummaryCards(
					new DetailSummaryCardsRequest(
						date.value,
						timeFrom.value,
						timeTo.value,
						groupBy.value,
						baseline,
						topNValue,
					),
				)
			},
		},
		{
			defaultBaseline: BaselineType.SameWeekday,
			initialWindowSize: 30,
			canFetch: () => date.value !== '',
			selectWindows: clampWindowsToRequestedRange,
		},
	)

	watch([dateModel, timeFrom, timeTo, groupBy], () => fetchAll(), { immediate: true })
	watch(date, newDate => router.replace({ query: { ...route.query, date: newDate } }))
</script>
