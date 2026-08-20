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
			<h1 class="text-h4">History Detail</h1>
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
			<div class="d-flex align-center ga-4 flex-wrap">
				<MyDateInput
					v-model="dateModel"
					label="Date"
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
	import { HistoryGroupBy } from '@/core/historyDashboard/component/types/HistoryGroupBy.ts'
	import { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
	import { DetailStackedBarsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailStackedBarsRequest.ts'
	import { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
	import { DetailSummaryCardsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailSummaryCardsRequest.ts'
	import {
		getDetailPieChart,
		getDetailStackedBars,
		getDetailSummaryCards,
	} from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import type { HistoryStackedBarsResponse } from '@/core/historyDashboard/dto/response/HistoryStackedBarsResponse.ts'
	import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
	import type { HistorySummaryCardsResponse } from '@/core/historyDashboard/dto/response/HistorySummaryCardsResponse.ts'
	import { isSameHistoryGroup, type HistoryGroupKey } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { resolveHistoryGroupColor } from '@/core/historyDashboard/dto/historyGroupColor.ts'
	import HistoryGroupBySelector from '@/core/historyDashboard/component/controls/HistoryGroupBySelector.vue'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import HistorySummaryCards from '@/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue'
	import HistoryPieChartSection from '@/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue'
	import HistoryTimeline from '@/core/historyDashboard/component/HistoryTimeline.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

	const route = useRoute()
	const router = useRouter()

	// --- State ---
	const today = new Date()
	const dateModel = ref<Date>(route.query.date ? new Date(route.query.date as string) : new Date())
	const timeFrom = ref(new Time(8, 0))
	const timeTo = ref(new Time(23, 59))
	const groupBy = ref<HistoryGroupBy>(HistoryGroupBy.Activity)
	const selectedGroup = ref<HistoryGroupKey | null>(null)
	const selectedBaseline = ref<BaselineType>(BaselineType.SameWeekday)
	const topN = ref(4)
	const selectedWindowSize = ref(30)
	const selectedVisualization = ref<'stackedBars' | 'timeline'>('timeline')

	const isStackedBars = computed(() => selectedVisualization.value === 'stackedBars')
	// --- Window size options for single day ---
	const windowSizeOptions = [15, 20, 30, 60]

	const date = computed(() => formatDateForApi(dateModel.value))

	// --- Data ---
	const stackedBarsData = ref<HistoryStackedBarsResponse | null>(null)
	const pieChartData = ref<HistoryPieChartResponse | null>(null)
	const summaryCardsData = ref<HistorySummaryCardsResponse | null>(null)

	// --- Loading States ---
	const stackedBarsLoading = ref(false)
	const pieChartLoading = ref(false)
	const summaryCardsLoading = ref(false)

	// --- Map HistoryWindow[] → StackedBarsInputWindow[] ---
	// B3 confirmed `windowStart`/`windowEnd` are always ISO 8601 with a `Z`; the old
	// `replace(' ', 'T')` fallback hedged against a serialization that never occurs.
	function parseDate(dateStr: string): Date {
		return new Date(dateStr)
	}

	/**
	 * B2 §4: `detail/stacked-bars` emits exactly 24 one-hour windows starting at the range's `from` and
	 * ignores `to` entirely, so a requested 08:00–16:00 comes back as 24 bars — 16 of them empty and
	 * extending past the requested end. Flagged as a backend bug; until it is fixed, clamp here rather
	 * than render the phantom tail as if it were the requested range.
	 *
	 * Clamping is done against the first window's start (which the backend does honour) plus the
	 * requested duration, so it holds whatever window size the server actually used.
	 */
	const requestedDurationMinutes = computed(() => {
		const span = (timeTo.value.getInMinutes - timeFrom.value.getInMinutes + 1440) % 1440
		return span === 0 ? 1440 : span
	})

	const clampedWindows = computed(() => {
		const windows = stackedBarsData.value?.windows ?? []
		const first = windows[0]
		if (!first) return []
		const cutoff = parseDate(first.windowStart).getTime() + requestedDurationMinutes.value * 60_000
		return windows.filter(w => parseDate(w.windowStart).getTime() < cutoff)
	})

	const stackedBarsWindows = computed<StackedBarsInputWindow[]>(() =>
		clampedWindows.value.map(w => ({
			windowStart: parseDate(w.windowStart),
			windowEnd: parseDate(w.windowEnd),
			items: w.items.map(item => ({
				name: item.name,
				activeSeconds: item.totalSeconds,
				backgroundSeconds: 0,
				color: resolveHistoryGroupColor(item),
			})),
		})),
	)

	// --- Fetch Functions ---
	async function fetchStackedBars() {
		stackedBarsLoading.value = true
		try {
			stackedBarsData.value = await getDetailStackedBars(
				new DetailStackedBarsRequest(
					date.value,
					timeFrom.value,
					timeTo.value,
					selectedWindowSize.value,
					groupBy.value,
				),
			)
		} catch {
			stackedBarsData.value = null
		} finally {
			stackedBarsLoading.value = false
		}
	}

	async function fetchPieChart() {
		pieChartLoading.value = true
		try {
			pieChartData.value = await getDetailPieChart(
				new DetailPieChartRequest(groupBy.value, 20, date.value, timeFrom.value, timeTo.value),
			)
		} catch {
			pieChartData.value = null
		} finally {
			pieChartLoading.value = false
		}
	}

	async function fetchSummaryCards() {
		summaryCardsLoading.value = true
		try {
			summaryCardsData.value = await getDetailSummaryCards(
				new DetailSummaryCardsRequest(
					date.value,
					timeFrom.value,
					timeTo.value,
					groupBy.value,
					selectedBaseline.value,
					topN.value,
				),
			)
		} catch {
			summaryCardsData.value = null
		} finally {
			summaryCardsLoading.value = false
		}
	}

	function fetchAll() {
		if (!date.value) return
		selectedGroup.value = null
		fetchStackedBars()
		fetchPieChart()
		fetchSummaryCards()
	}

	watch([dateModel, timeFrom, timeTo, groupBy], () => fetchAll(), { immediate: true })
	watch(selectedBaseline, () => fetchSummaryCards())
	watch(date, newDate => router.replace({ query: { ...route.query, date: newDate } }))

	// --- Event Handlers ---
	function handleBaselineChange(value: BaselineType) {
		selectedBaseline.value = value
	}

	function handleTopNChange(value: number) {
		topN.value = value
		fetchSummaryCards()
	}

	function handleGroupSelect(group: HistoryGroupKey) {
		selectedGroup.value = isSameHistoryGroup(selectedGroup.value, group) ? null : group
	}

	function handleWindowSizeChange(size: number) {
		selectedWindowSize.value = size
		fetchStackedBars()
	}
</script>
