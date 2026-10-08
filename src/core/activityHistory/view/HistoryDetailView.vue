<template>
	<div class="px-2 py-6 w-100 h-100 d-flex flex-column">
		<!-- Header -->
		<div class="w-100 d-flex align-center ga-6 flex-wrap">
			<VIconBtn
				icon="calendar-days"
				variant="tonal"
				style="margin-right: -12px"
				@click="router.push({ name: 'activityHistoryCalendar' })"
			>
				<VIcon icon="calendar-days" />
				<VTooltip
					activator="parent"
					location="bottom"
				>
					{{ $t('history.detail.openCalendar') }}
				</VTooltip>
			</VIconBtn>
			<VIconBtn
				icon="chart-line"
				variant="tonal"
				style="margin-right: -12px"
				@click="goToSummaryForWeek"
			>
				<VIcon icon="chart-line" />
				<VTooltip
					activator="parent"
					location="bottom"
				>
					{{ $t('history.detail.openSummary') }}
				</VTooltip>
			</VIconBtn>
			<h1 class="text-h4">{{ $t('history.detail.title') }}</h1>
			<MyBtnToggle
				v-model="selectedVisualization"
				:label="$t('general.view')"
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
			</MyBtnToggle>
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
				<VBtn
					v-if="rangeBeforeDrill"
					variant="tonal"
					color="secondaryOutline"
					prependIcon="arrow-rotate-left"
					@click="restoreRange"
				>
					{{
						$t('history.detail.restoreRange', {
							from: rangeBeforeDrill.timeFrom.getString(),
							to: rangeBeforeDrill.timeTo.getString(),
						})
					}}
				</VBtn>
			</div>
			<HistoryGroupBySelector v-model="groupBy" />
			<ExportMenu
				class="ml-auto"
				:loading="exporting"
				@export="exportDetail"
			/>
		</div>

		<!-- First run: never recorded anything, anywhere — one onboarding block instead of the usual
		     panels (H7). -->
		<HistoryFirstRunState
			v-if="hasAnyHistoryEver === false"
			class="flex-fill"
		/>

		<template v-else>
			<!-- Visualization Toggle. `min-content`: never shorter than the chart's header plus its plot's
			     floor (F95). -->
			<div
				v-if="isStackedBars"
				class="flex-fill"
				style="min-height: min-content"
			>
				<StackedBarsChart
					class="w-100"
					:windows="stackedBarsWindows"
					:loading="stackedBarsLoading"
					:error="stackedBarsError"
					:timeFrom
					:timeTo
					:windowSizeOptions="windowSizeOptions"
					:initialWindowSize="selectedWindowSize"
					@windowSizeChange="handleWindowSizeChange"
					interactive
					@activityClick="drillIntoWindow"
					@retry="fetchStackedBars"
				/>
			</div>

			<!-- Summary Cards + Pie Chart -->
			<div
				v-if="isStackedBars"
				class="mt-6"
			>
				<HistoryInsightsColumn
					direction="row"
					v-model:selectedGroup="selectedGroup"
					:summaryCardsData
					:pieChartData
					:groupBy
					:selectedBaseline
					:topN
					:summaryLoading="summaryCardsLoading"
					:pieLoading="pieChartLoading"
					:summaryError="summaryCardsError"
					:pieError="pieChartError"
					:periodLabel
					@update:selectedBaseline="handleBaselineChange"
					@update:topN="handleTopNChange"
					@groupClick="handleGroupSelect"
					@retrySummary="fetchSummaryCards"
					@retryPie="fetchPieChart"
				/>
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
					<HistoryInsightsColumn
						direction="column"
						v-model:selectedGroup="selectedGroup"
						:summaryCardsData
						:pieChartData
						:groupBy
						:selectedBaseline
						:topN
						:summaryLoading="summaryCardsLoading"
						:pieLoading="pieChartLoading"
						:summaryError="summaryCardsError"
						:pieError="pieChartError"
						:periodLabel
						@update:selectedBaseline="handleBaselineChange"
						@update:topN="handleTopNChange"
						@groupClick="handleGroupSelect"
						@retrySummary="fetchSummaryCards"
						@retryPie="fetchPieChart"
					/>
				</VCol>
			</VRow>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
	import { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
	import { DetailStackedBarsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailStackedBarsRequest.ts'
	import { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
	import { DetailSummaryCardsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailSummaryCardsRequest.ts'
	import { DetailTimelineRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailTimelineRequest.ts'
	import {
		getDetailPieChart,
		getDetailStackedBars,
		getDetailSummaryCards,
		getDetailTimeline,
	} from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import type { HistoryWindow } from '@/core/historyDashboard/dto/response/HistoryWindow.ts'
	import type { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import HistoryGroupBySelector from '@/core/historyDashboard/component/controls/HistoryGroupBySelector.vue'
	import StackedBarsChart from '@/core/activityTracking/component/stackedBars/StackedBarsChart.vue'
	import HistoryInsightsColumn from '@/core/historyDashboard/component/HistoryInsightsColumn.vue'
	import HistoryTimeline from '@/core/historyDashboard/component/HistoryTimeline.vue'
	import HistoryFirstRunState from '@/core/historyDashboard/component/HistoryFirstRunState.vue'
	import ExportMenu from '@/_common/component/ExportMenu.vue'
	import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { formatDateForApi, formatToDate, getWeekStart } from '@/_common/utils/DateTimeHelper.ts'
	import { fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'
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
		formatIsoWithOffset,
		useCsvExport,
	} from '@/core/activityHistory/composable/useHistoryExport.ts'
	import { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import { useSetBreadcrumbExtra } from '@/_common/composable/general/useBreadcrumbs.ts'
	import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import type { StackedBarsInputWindow } from '@/core/activityTracking/dto/StackedBarsInput.ts'

	const VISUALIZATIONS = ['stackedBars', 'timeline'] as const
	type Visualization = (typeof VISUALIZATIONS)[number]

	const route = useRoute()
	const router = useRouter()
	const i18n = useI18n()
	const { firstDayOfWeek } = useUserPreferences()

	// This drill-down has no nav entry of its own, so the trail stops at the longest prefix match —
	// Summary's `/activity-history`. Append our own crumb; the composable clears it on unmount.
	const { setBreadcrumbExtra } = useSetBreadcrumbExtra()
	watch(
		() => i18n.t('history.detail.title'),
		title => setBreadcrumbExtra([{ title }]),
		{ immediate: true },
	)

	// --- State: the single day and time-of-day window this view asks its questions over ---
	const today = new Date()
	const dateModel = ref<Date>(route.query.date ? new Date(route.query.date as string) : new Date())
	const timeFrom = ref(parseTimeParam(route.query.timeFrom, new Time(8, 0)))
	// 00:00, not 23:59: the backend reads the window as half-open with an at-or-before-`from` end rolling
	// to the next day, so 08:00–00:00 is the rest of the day exactly. 23:59 was also unrepresentable in
	// `TimeRangePicker`'s duration mode (its minutes input caps at 55), which rewrote it to 23:55 on
	// mount and fired every panel's request a second time.
	const timeTo = ref(parseTimeParam(route.query.timeTo, new Time(0, 0)))
	const groupBy = ref<HistoryGroupBy>(
		parseEnumParam(route.query.groupBy, Object.values(HistoryGroupBy), HistoryGroupBy.Activity),
	)
	const selectedVisualization = ref<Visualization>(parseEnumParam(route.query.view, VISUALIZATIONS, 'timeline'))

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
		stackedBarsError,
		pieChartError,
		summaryCardsError,
		hasAnyHistoryEver,
		fetchStackedBars,
		fetchPieChart,
		fetchSummaryCards,
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
			initialWindowSize: parseWindowSize(route.query.windowSize, 30),
			initialBaseline: parseEnumParam(
				route.query.baseline,
				Object.values(BaselineType),
				BaselineType.SameWeekday,
			),
			initialTopN: parseTopN(route.query.topN, DEFAULT_TOP_N),
			canFetch: () => date.value !== '',
			selectWindows: clampWindowsToRequestedRange,
		},
	)

	watch([dateModel, timeFrom, timeTo, groupBy], () => fetchAll(), { immediate: true })

	// Empty-state period label (H7) — a single day, so no range math needed.
	const periodLabel = computed(() => formatToDate(dateModel.value))

	// --- Export (H8) ---
	// The raw record list, fetched independently of `HistoryTimeline` (which only mounts in the
	// timeline visualization) so export works the same regardless of which view is currently shown.
	// Same endpoint/request the timeline itself uses, just for the current date/time-of-day window.
	const { exporting, exportCsv } = useCsvExport()

	function exportDetail(format: ExportFormat) {
		return exportCsv(format, async () => {
			const records = await getDetailTimeline(new DetailTimelineRequest(date.value, timeFrom.value, timeTo.value))
			const csv = buildCsv<ActivityHistory>(
				[
					{
						header: i18n.t('historyDashboard.export.detail.columns.start'),
						value: r => formatIsoWithOffset(r.startTimestamp),
					},
					{
						header: i18n.t('historyDashboard.export.detail.columns.end'),
						value: r =>
							formatIsoWithOffset(new Date(r.startTimestamp.getTime() + r.length.getInSeconds * 1000)),
					},
					{
						header: i18n.t('historyDashboard.export.detail.columns.durationSeconds'),
						value: r => r.length.getInSeconds,
					},
					{
						header: i18n.t('historyDashboard.export.detail.columns.duration'),
						value: r => fromSecondsDetailed(r.length.getInSeconds),
					},
					{ header: i18n.t('historyDashboard.export.detail.columns.activity'), value: r => r.activity.name },
					{
						header: i18n.t('historyDashboard.export.detail.columns.category'),
						value: r => r.activity.category?.name ?? '',
					},
					{ header: i18n.t('historyDashboard.export.detail.columns.role'), value: r => r.activity.role.name },
					{
						header: i18n.t('historyDashboard.export.detail.columns.notes'),
						value: r => r.activity.text ?? '',
					},
					// The session id is what lets a spreadsheet put a pomodoro's phase rows back together.
					{
						header: i18n.t('historyDashboard.export.detail.columns.session'),
						value: r => r.session?.id ?? '',
					},
					{
						header: i18n.t('historyDashboard.export.detail.columns.phase'),
						value: r => (r.phase === null ? '' : i18n.t(`history.session.phase.${r.phase}`)),
					},
					{
						header: i18n.t('historyDashboard.export.detail.columns.outcome'),
						value: r => (r.session === null ? '' : i18n.t(`history.session.outcome.${r.session.outcome}`)),
					},
					// Seconds, like durationSeconds, so a spreadsheet can set it against the rows' total.
					{
						header: i18n.t('historyDashboard.export.detail.columns.plannedSeconds'),
						value: r => r.session?.plannedLength?.getInSeconds ?? '',
					},
				],
				records,
			)
			return {
				csv,
				fileName: buildExportFileName([
					i18n.t('historyDashboard.export.detail.fileNamePrefix'),
					date.value,
					timeFrom.value.getString(),
					timeTo.value.getString(),
					groupBy.value,
				]),
			}
		})
	}

	// --- Drill-through: a bar narrows the day to its window and opens the timeline over it. ---
	// The whole view narrows, not just the timeline, so the insights column beside it describes the same
	// records. `windowStart`/`windowEnd` are instants; the time-of-day window is a user-zone wall clock
	// (B3), so read them in the user's zone. A window ending at midnight reads 00:00, which the backend
	// already takes as the end of the day. Only the first drill records the range to go back to, so
	// drilling again from an already narrowed chart still returns to the original one.
	const rangeBeforeDrill = ref<{ timeFrom: Time; timeTo: Time } | null>(null)
	/** The range the last drill set — what the view must still show for *Back* to mean anything. */
	let drilledRange: { timeFrom: Time; timeTo: Time } | null = null

	function drillIntoWindow(window: StackedBarsInputWindow) {
		rangeBeforeDrill.value ??= { timeFrom: timeFrom.value, timeTo: timeTo.value }
		drilledRange = { timeFrom: timeInUserZone(window.windowStart), timeTo: timeInUserZone(window.windowEnd) }
		timeFrom.value = drilledRange.timeFrom
		timeTo.value = drilledRange.timeTo
		selectedVisualization.value = 'timeline'
	}

	function restoreRange() {
		if (!rangeBeforeDrill.value) return
		timeFrom.value = rangeBeforeDrill.value.timeFrom
		timeTo.value = rangeBeforeDrill.value.timeTo
		forgetDrill()
	}

	function forgetDrill() {
		rangeBeforeDrill.value = null
		drilledRange = null
	}

	// A range the user set by hand, or a new day, is a new question: going "back" from it would undo their
	// own edit. Compared by value, not by who wrote it — the picker re-emits the range the drill just set
	// while it re-renders, so its update events cannot tell a user's edit from the drill's own write.
	watch([timeFrom, timeTo], ([from, to]) => {
		if (!drilledRange) return
		if (
			from.getInMinutes !== drilledRange.timeFrom.getInMinutes ||
			to.getInMinutes !== drilledRange.timeTo.getInMinutes
		) {
			forgetDrill()
		}
	})

	watch(dateModel, forgetDrill)

	// --- Back to the summary view for the week containing this day. ---
	function goToSummaryForWeek() {
		router.push({
			name: 'activityHistory',
			query: {
				date: formatDateForApi(getWeekStart(dateModel.value, firstDayOfWeek.value)),
				range: ActivityDateRangeTypeEnum.Week,
				groupBy: groupBy.value,
			},
		})
	}

	// --- Sync state to URL ---
	useHistoryUrlSync(
		[date, selectedVisualization, timeFrom, timeTo, groupBy, selectedWindowSize, selectedBaseline, topN],
		() => ({
			date: date.value,
			view: selectedVisualization.value,
			...sharedHistoryQueryParams({
				groupBy: groupBy.value,
				windowSize: selectedWindowSize.value,
				timeFrom: timeFrom.value,
				timeTo: timeTo.value,
				baseline: selectedBaseline.value,
				topN: topN.value,
			}),
		}),
	)
</script>
