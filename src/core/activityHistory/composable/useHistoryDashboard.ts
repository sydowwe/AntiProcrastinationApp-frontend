import { computed, ref, watch, type Ref } from 'vue'
import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
import type { StackedBarsInputWindow } from '@/core/activityTracking/dto/StackedBarsInput.ts'
import type { HistoryStackedBarsResponse } from '@/core/historyDashboard/dto/response/HistoryStackedBarsResponse.ts'
import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
import type { HistorySummaryCardsResponse } from '@/core/historyDashboard/dto/response/HistorySummaryCardsResponse.ts'
import type { HistoryTimeOfDayResponse } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayResponse.ts'
import type { HistoryWindow } from '@/core/historyDashboard/dto/response/HistoryWindow.ts'
import { isSameHistoryGroup, type HistoryGroupKey } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'
import { resolveHistoryGroupColor } from '@/core/historyDashboard/dto/historyGroupColor.ts'
import { getHasAnyHistoryEver } from '@/core/historyDashboard/api/historyDashboardApi.ts'

/** Both dashboards open on the same number of summary cards; neither exposes it as a preference. */
export const DEFAULT_TOP_N = 4

/**
 * `windowStart`/`windowEnd` are ISO 8601 with a `Z` (B2/B3) — UTC *instants*, not wall clocks — so a
 * bare `new Date` parses them unambiguously in every browser. Kept as a named function purely to carry
 * that provenance to the call sites; the summary view reads the first and last window to derive the
 * chart's axis bounds, and the detail view parses each window's start to clamp the backend's phantom
 * tail (see `HistoryDetailView.vue`).
 */
export function parseWindowInstant(value: string): Date {
	return new Date(value)
}

/**
 * The per-endpoint half of a dashboard: three functions that each close over their own API function,
 * their own request class and whatever date/range model the view holds, and return the shared response
 * type. Everything the *composable* owns — window size, baseline, top-N — arrives as an argument
 * instead, so a fetcher never reaches back into the composable's state.
 */
export interface HistoryDashboardFetchers {
	fetchStackedBars(windowSize: number): Promise<HistoryStackedBarsResponse>

	fetchPieChart(): Promise<HistoryPieChartResponse>

	fetchSummaryCards(baseline: BaselineType, topN: number): Promise<HistorySummaryCardsResponse>

	/**
	 * Optional fourth panel-less round: the hour-of-day fold behind the insights surface (H10). Only the
	 * summary dashboard has an endpoint for it — `summary/time-of-day` takes a date *range*, and the
	 * detail view's day is not one — so the detail view leaves it out and `timeOfDayData` stays null
	 * there. It carries no `groupBy`, so a `groupBy` change re-fetches it for nothing; that is one small
	 * request against keeping every panel on one refresh cycle with one clearing rule.
	 */
	fetchTimeOfDay?(): Promise<HistoryTimeOfDayResponse>
}

export interface HistoryDashboardOptions {
	/** Summary compares against the trailing week, detail against the same weekday. */
	defaultBaseline: BaselineType
	/** In minutes. Detail opens on a fixed 30; summary seeds it from the URL. */
	initialWindowSize: number
	/**
	 * Guards every round — a view whose date model is not resolved yet fetches nothing rather than
	 * asking for a range the backend would reject.
	 */
	canFetch(): boolean
	/**
	 * Optional last chance to drop windows the backend returned but the view did not ask for, applied
	 * before the mapping below. Defaults to keeping all of them; only the detail view sets it, to work
	 * around `detail/stacked-bars` ignoring the requested `to` (B2 §4).
	 */
	selectWindows?(windows: HistoryWindow[]): HistoryWindow[]
	/** URL-seeded starting value (H6). Defaults to `defaultBaseline` when the view has no query param yet. */
	initialBaseline?: BaselineType
	/** URL-seeded starting value (H6). Defaults to `DEFAULT_TOP_N` when the view has no query param yet. */
	initialTopN?: number
}

/**
 * State, fetch orchestration and event handling shared by the summary and detail history dashboards.
 *
 * It deliberately does **not** know which of the two it is driving: it names no `HistorySummary*` or
 * `Detail*` request class and holds no date model. The two views ask different questions — a multi-day
 * range vs one day's timeline — and keep their own controls, watches, URL sync and template; this owns
 * only the machinery that was identical in both.
 *
 * Shaped after `activityTracking`'s `useActivityDashboard`, which solves the same problem for that
 * module's three dashboards. The two are not merged and should not be: the request/response trees have
 * nothing in common. Where a choice was arbitrary, it was made the same way there.
 */
export function useHistoryDashboard(fetchers: HistoryDashboardFetchers, options: HistoryDashboardOptions) {
	const { defaultBaseline, initialWindowSize, canFetch, selectWindows, initialBaseline, initialTopN } = options

	// --- Shared State ---
	const selectedGroup = ref<HistoryGroupKey | null>(null)
	const selectedBaseline = ref<BaselineType>(initialBaseline ?? defaultBaseline)
	const topN = ref(initialTopN ?? DEFAULT_TOP_N)
	const selectedWindowSize = ref(initialWindowSize)

	// --- Data ---
	// Cast to `Ref<T | null>` so the response classes keep their declared shape through the template
	// and through `selectWindows`, rather than widening into `UnwrapRef` (CLAUDE.md, R12/R13).
	const stackedBarsData = ref<HistoryStackedBarsResponse | null>(null) as Ref<HistoryStackedBarsResponse | null>
	const pieChartData = ref<HistoryPieChartResponse | null>(null) as Ref<HistoryPieChartResponse | null>
	const summaryCardsData = ref<HistorySummaryCardsResponse | null>(null) as Ref<HistorySummaryCardsResponse | null>
	const timeOfDayData = ref<HistoryTimeOfDayResponse | null>(null) as Ref<HistoryTimeOfDayResponse | null>

	// --- Loading States ---
	const stackedBarsLoading = ref(false)
	const pieChartLoading = ref(false)
	const summaryCardsLoading = ref(false)
	const timeOfDayLoading = ref(false)

	// --- First-run detection (H7) ---
	// `null` = not yet known, `true`/`false` = resolved for this session. Once resolved it is never
	// re-checked: a non-empty period is proof enough of `true`, and a `false` only flips back to `true`
	// the same way (the next period that actually has data), never by re-asking the same question.
	const hasAnyHistoryEver = ref<boolean | null>(null)

	// --- Map HistoryWindow[] → StackedBarsInputWindow[] ---
	// `backgroundSeconds` is always 0: the history endpoints report logged time only, with no notion of
	// the foreground/background split the activity-tracking sources carry.
	const stackedBarsWindows = computed<StackedBarsInputWindow[]>(() => {
		const windows = stackedBarsData.value?.windows ?? []
		const selected = selectWindows ? selectWindows(windows) : windows
		return selected.map(w => ({
			windowStart: parseWindowInstant(w.windowStart),
			windowEnd: parseWindowInstant(w.windowEnd),
			items: w.items.map(item => ({
				name: item.name,
				activeSeconds: item.totalSeconds,
				backgroundSeconds: 0,
				color: resolveHistoryGroupColor(item),
			})),
		}))
	})

	// --- Fetch Functions ---
	// A failure nulls its own panel's data rather than leaving the previous range's numbers on screen
	// under the new range's header, which is the one way a stale chart reads as a true one. The axios
	// interceptor still raises the error snackbar, so the failure itself is not swallowed.
	async function fetchStackedBars() {
		stackedBarsLoading.value = true
		try {
			stackedBarsData.value = await fetchers.fetchStackedBars(selectedWindowSize.value)
		} catch {
			stackedBarsData.value = null
		} finally {
			stackedBarsLoading.value = false
		}
	}

	async function fetchPieChart() {
		pieChartLoading.value = true
		try {
			pieChartData.value = await fetchers.fetchPieChart()
		} catch {
			pieChartData.value = null
		} finally {
			pieChartLoading.value = false
		}
	}

	async function fetchSummaryCards() {
		summaryCardsLoading.value = true
		try {
			summaryCardsData.value = await fetchers.fetchSummaryCards(selectedBaseline.value, topN.value)
		} catch {
			summaryCardsData.value = null
		} finally {
			summaryCardsLoading.value = false
		}
	}

	/** Resolves to null — never leaving the previous range's fold behind — when the view supplies no fetcher. */
	async function fetchTimeOfDay() {
		if (!fetchers.fetchTimeOfDay) {
			timeOfDayData.value = null
			return
		}
		timeOfDayLoading.value = true
		try {
			timeOfDayData.value = await fetchers.fetchTimeOfDay()
		} catch {
			timeOfDayData.value = null
		} finally {
			timeOfDayLoading.value = false
		}
	}

	/**
	 * One full refresh of every panel, fired in parallel rather than awaited in sequence so one slow
	 * endpoint never blocks the others.
	 *
	 * The selection is cleared first because a round only ever runs when the scope changed, and a
	 * `HistoryGroupKey` is only comparable within the `groupBy` it was made under (see
	 * `HistoryGroupKey.ts`) — carrying it across would silently highlight a different group.
	 */
	async function fetchAll() {
		if (!canFetch()) return
		selectedGroup.value = null
		await Promise.all([fetchStackedBars(), fetchPieChart(), fetchSummaryCards(), fetchTimeOfDay()])
		await checkFirstRunIfEmpty()
	}

	/**
	 * The one extra request H7 allows: fired only when every panel came back empty for the period just
	 * fetched, to tell "nothing in this window" apart from "nothing ever". A non-empty panel already
	 * answers the question for free.
	 *
	 * `timeOfDayData` is deliberately not part of the test: it is a fold of the same records the pie
	 * chart counts, so it is empty exactly when the pie chart is and would cast no independent vote.
	 */
	async function checkFirstRunIfEmpty() {
		const isEmpty =
			stackedBarsWindows.value.length === 0 &&
			(pieChartData.value?.items.length ?? 0) === 0 &&
			(summaryCardsData.value?.cards.length ?? 0) === 0
		if (!isEmpty) {
			hasAnyHistoryEver.value = true
			return
		}
		if (hasAnyHistoryEver.value !== null) return
		hasAnyHistoryEver.value = await getHasAnyHistoryEver()
	}

	// The cards carry a comparison against the selected baseline, so the selector has to re-fetch them.
	watch(selectedBaseline, () => fetchSummaryCards())

	// --- Event Handlers ---
	function handleBaselineChange(value: BaselineType) {
		selectedBaseline.value = value
	}

	function handleTopNChange(value: number) {
		topN.value = value
		fetchSummaryCards()
	}

	/** Clicking the already-selected group clears the selection. */
	function handleGroupSelect(group: HistoryGroupKey) {
		selectedGroup.value = isSameHistoryGroup(selectedGroup.value, group) ? null : group
	}

	function handleWindowSizeChange(size: number) {
		selectedWindowSize.value = size
		fetchStackedBars()
	}

	return {
		selectedGroup,
		selectedBaseline,
		topN,
		selectedWindowSize,
		// The raw response, for the summary view's axis bounds — everything else reads
		// `stackedBarsWindows`.
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
		fetchPieChart,
		fetchSummaryCards,
		fetchTimeOfDay,
		fetchAll,
		handleBaselineChange,
		handleTopNChange,
		handleGroupSelect,
		handleWindowSizeChange,
	}
}
