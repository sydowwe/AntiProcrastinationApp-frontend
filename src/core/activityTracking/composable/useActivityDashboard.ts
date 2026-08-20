import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { Time } from '@/_common/dto/dto/Time.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { BaselineOption, BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
import type { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
import type { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
import type { StackedBarsInputWindow } from '@/core/activityTracking/component/stackedBars/dto/StackedBarsInput'
import {
	SINGLE_DAY_WINDOW_SIZES,
	windowSizeOptionsForSpan,
} from '@/core/activityTracking/component/stackedBars/stackedBarsUtils.ts'
import { clampSpanEnd, daySpanCount, isSameDay } from '@/core/activityTracking/composable/useActivityRangePresets.ts'
import type { FocusMetricsResponse } from '@/core/activityTracking/dto/response/focusMetrics/FocusMetricsResponse.ts'

export type ActivityVisualization = 'stackedBars' | 'timeline'

/**
 * `idle` — not empty, or not checked yet.
 * `checking` — the full-day probe is in flight.
 * `hasDataOutsideWindow` — the range has data, just not inside the selected time-of-day window.
 * `emptyFullDay` — the range has no data even over the full 00:00-24:00 window.
 */
export type ActivityEmptyProbeState = 'idle' | 'checking' | 'hasDataOutsideWindow' | 'emptyFullDay'

/** Kept as a named export: the single-day ladder is still the default and several call sites read it. */
export const activityWindowSizeOptions = SINGLE_DAY_WINDOW_SIZES

/**
 * The scope every dashboard request is made against. `dateFrom`/`dateTo` are inclusive and already
 * formatted for the API; a single day is `dateFrom === dateTo`.
 *
 * `timeFrom`/`timeTo` are a TIME-OF-DAY window applied to EACH day in the span, not the endpoints of
 * the span — see `ActivityRangeRequest` and the backend contract.
 */
export interface ActivityDashboardRange {
	dateFrom: string
	dateTo: string
	timeFrom: Time
	timeTo: Time
}

/** The three timeline lanes. A source without detail/background lanes returns empty arrays for them. */
export interface ActivityTimelineSessions {
	primarySessions: TimelineSessionDto[]
	detailSessions: TimelineSessionDto[]
	backgroundSessions: TimelineSessionDto[]
}

/**
 * The per-source half of a dashboard: five functions that each close over their own API module and
 * request class and return the shared view-model type. The pie chart is the one shape that is not
 * shared, so it stays generic and is handed back to the view untouched.
 */
export interface ActivityDashboardFetchers<TPieChart> {
	fetchSummaryCards(
		range: ActivityDashboardRange,
		baseline: BaselineType,
		signal: AbortSignal,
	): Promise<SummaryCardsData[] | null>

	fetchPieChart(range: ActivityDashboardRange, signal: AbortSignal): Promise<TPieChart | null>

	fetchStackedBars(
		range: ActivityDashboardRange,
		windowSize: number,
		signal: AbortSignal,
	): Promise<StackedBarsInputWindow[]>

	fetchTimeline(range: ActivityDashboardRange, signal: AbortSignal): Promise<ActivityTimelineSessions>

	/**
	 * The tolerance the metrics are computed against is the frontend's decision, so the implementation
	 * sends `FOCUS_BLOCK_TOLERANCE_SECONDS` as the request's `focusGapSeconds` rather than letting the
	 * server pick one — see the constant's own comment.
	 */
	fetchFocusMetrics(
		range: ActivityDashboardRange,
		baseline: BaselineType,
		signal: AbortSignal,
	): Promise<FocusMetricsResponse | null>
}

/**
 * Extra state a view adds to the dashboard's own. Everything here is optional and defaults to the
 * behaviour the three per-source dashboards have always had.
 */
export interface ActivityDashboardOptions {
	/**
	 * Bookmarkable state the *view* owns, merged into the query by `syncQueryToUrl` below.
	 *
	 * It is routed through the composable rather than written by the view because `syncQueryToUrl`
	 * spreads `route.query` and then calls `router.replace`: a second writer doing the same thing in
	 * the same tick reads a pre-replace query and drops whichever param the other one had just added.
	 * One writer, no race. A key whose value is `undefined` is deleted, which is how a view omits a
	 * param that is at its default.
	 */
	extraQuery?: ComputedRef<LocationQueryRaw>
}

function emptyTimelineSessions(): ActivityTimelineSessions {
	return { primarySessions: [], detailSessions: [], backgroundSessions: [] }
}

/** Axios rejects an aborted request rather than resolving it — this tells that case apart from a real failure. */
function isAbortError(error: unknown): boolean {
	return axios.isCancel(error)
}

// --- URL query-state (defaults, encode/parse) ---

const DATE_PARAM = 'date'
const DATE_TO_PARAM = 'dateTo'
const FROM_PARAM = 'from'
const TO_PARAM = 'to'
const VIEW_PARAM = 'view'
const BASELINE_PARAM = 'baseline'
const WINDOW_PARAM = 'window'
const SELECTED_PARAM = 'selected'

const DEFAULT_TIME_FROM = new Time(7, 0)
const DEFAULT_TIME_TO = new Time(0, 0)
const DEFAULT_VISUALIZATION: ActivityVisualization = 'timeline'
const DEFAULT_BASELINE = BaselineType.Last7Days
const DEFAULT_WINDOW_SIZE = 30

/**
 * How long a scrub of the time-range picker settles before a round fires. Exported so a panel a view
 * adds on top of the shared four — the unified dashboard's source breakdown — settles with them
 * rather than on its own rhythm.
 */
export const ACTIVITY_FETCH_DEBOUNCE_MS = 300

function firstQueryValue(value: unknown): string | undefined {
	if (Array.isArray(value)) {
		return typeof value[0] === 'string' ? value[0] : undefined
	}
	return typeof value === 'string' ? value : undefined
}

/** Strict yyyy-MM-dd parse — rejects anything dayjs-free `new Date(str)` would silently coerce. */
function parseIsoDate(value: string | undefined): Date | null {
	if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return null
	}
	const [year, month, day] = value.split('-').map(Number)
	const date = new Date(year, month - 1, day)
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return null
	}
	return date
}

function parseTime(value: string | undefined): Time | null {
	if (value === undefined || !/^\d{2}:\d{2}$/.test(value)) {
		return null
	}
	const time = Time.fromString(value)
	if (time.hours < 0 || time.hours > 23 || time.minutes < 0 || time.minutes > 59) {
		return null
	}
	return time
}

function parseVisualization(value: string | undefined): ActivityVisualization | null {
	return value === 'stackedBars' || value === 'timeline' ? value : null
}

function parseBaseline(value: string | undefined): BaselineType | null {
	return (Object.values(BaselineType) as string[]).includes(value ?? '') ? (value as BaselineType) : null
}

/**
 * Any positive integer is accepted rather than a fixed list — the valid set now depends on the span,
 * and a value that no longer fits is corrected by `windowSizeOptions` below rather than dropped here.
 */
function parseWindowSize(value: string | undefined): number | null {
	const parsed = Number(value)
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * State, fetch orchestration and event handling shared by the web-extension, desktop and android
 * dashboards. It knows nothing about any one source — everything source-specific arrives through
 * `fetchers` and everything source-specific about rendering stays in the view.
 */
export function useActivityDashboard<TPieChart>(
	fetchers: ActivityDashboardFetchers<TPieChart>,
	options: ActivityDashboardOptions = {},
) {
	const { t } = useI18n()
	const route = useRoute()
	const router = useRouter()

	/** Baselines the summary cards compare the selected span against. */
	const baselineOptions = computed<BaselineOption[]>(() => [
		new BaselineOption(BaselineType.Last7Days, t('activityTracking.baseline.last7Days')),
		new BaselineOption(BaselineType.Last30Days, t('activityTracking.baseline.last30Days')),
		new BaselineOption(BaselineType.SameWeekday, t('activityTracking.baseline.sameWeekday')),
		new BaselineOption(BaselineType.AllTime, t('activityTracking.baseline.allTime')),
	])

	// --- Date & Time State, seeded from the URL where present and valid ---
	const dateFrom = ref<Date>(parseIsoDate(firstQueryValue(route.query[DATE_PARAM])) ?? new Date())
	const dateTo = ref<Date>(seedDateTo())
	const timeFrom = ref(parseTime(firstQueryValue(route.query[FROM_PARAM])) ?? DEFAULT_TIME_FROM)
	const timeTo = ref(parseTime(firstQueryValue(route.query[TO_PARAM])) ?? DEFAULT_TIME_TO)

	/**
	 * An absent, malformed or backwards `dateTo` collapses to a single day rather than erroring — a
	 * hand-edited or truncated URL should land on today's dashboard, not a broken one. Every pre-range
	 * URL, which carries no `dateTo` at all, therefore still opens on exactly the day it named.
	 */
	function seedDateTo(): Date {
		const parsed = parseIsoDate(firstQueryValue(route.query[DATE_TO_PARAM]))
		if (parsed === null || parsed < dateFrom.value) {
			return dateFrom.value
		}
		return clampSpanEnd(dateFrom.value, parsed)
	}

	// --- Shared State, also seeded from the URL ---
	const selectedItem = ref<string | null>(firstQueryValue(route.query[SELECTED_PARAM]) ?? null)
	const selectedBaseline = ref<BaselineType>(
		parseBaseline(firstQueryValue(route.query[BASELINE_PARAM])) ?? DEFAULT_BASELINE,
	)
	const selectedVisualization = ref<ActivityVisualization>(
		parseVisualization(firstQueryValue(route.query[VIEW_PARAM])) ?? DEFAULT_VISUALIZATION,
	)

	// --- Span-derived state ---
	// Declared before `selectedWindowSize` because seeding that ref needs the option list: `parseWindowSize`
	// can no longer validate against a fixed ladder (the valid set depends on the span), so the URL value
	// has to be checked against the options for the span actually being opened.
	const dayCount = computed(() => daySpanCount(dateFrom.value, dateTo.value))
	const isRangeMode = computed(() => dayCount.value > 1)

	/** Length of the time-of-day window, carrying the past-midnight rule. 07:00-00:00 → 1020 minutes. */
	const dailyWindowMinutes = computed(() => {
		const fromMinutes = timeFrom.value.getInMinutes
		const toMinutes = timeTo.value.getInMinutes
		return toMinutes > fromMinutes ? toMinutes - fromMinutes : toMinutes + 24 * 60 - fromMinutes
	})

	/**
	 * The stacked-bars window unit is adaptive rather than fixed: the same 15-120 minute ladder over a
	 * week is 400-plus columns of unreadable slivers. A day keeps the historical ladder exactly; longer
	 * spans get whatever sizes land inside the chart's column budget, finest first.
	 *
	 * The alternative — forcing one column per day — was rejected because it throws away the chart's
	 * only distinctive axis. Time-of-day structure ("I lose the morning to mail") is the question the
	 * stacked bars answer and the summary cards cannot; at 4h windows over a week that survives.
	 */
	const windowSizeOptions = computed(() => windowSizeOptionsForSpan(dayCount.value, dailyWindowMinutes.value))

	/**
	 * Clamped at seed time rather than by the watcher below, which is not `immediate` — an unclamped
	 * value would otherwise reach the first fetch and leave the chart's select showing no matching item.
	 * `?window=999` has to land somewhere sane on the very first render, not one span change later.
	 */
	const selectedWindowSize = ref(clampWindowSize(parseWindowSize(firstQueryValue(route.query[WINDOW_PARAM]))))

	function clampWindowSize(size: number | null): number {
		const options = windowSizeOptions.value
		if (size !== null && options.includes(size)) return size
		return options.includes(DEFAULT_WINDOW_SIZE) ? DEFAULT_WINDOW_SIZE : options[0]!
	}

	/**
	 * The timeline is not range-capable, so a range forces stacked bars while leaving the user's own
	 * choice untouched — going back to a single day restores it. `TimelineTimeAxis` emits a tick every
	 * five minutes across from→to (8,640 positioned nodes over 30 days) and a continuous axis would
	 * also render each night's untracked gap as if it were tracked-and-idle, which is a different claim.
	 */
	const isTimelineAvailable = computed(() => !isRangeMode.value)
	const effectiveVisualization = computed<ActivityVisualization>(() =>
		isTimelineAvailable.value ? selectedVisualization.value : 'stackedBars',
	)

	// --- View Models ---
	const summaryCardsData = ref<SummaryCardsData[] | null>(null) as Ref<SummaryCardsData[] | null>
	const pieChartData = ref<TPieChart | null>(null) as Ref<TPieChart | null>
	const stackedBarsWindows = ref<StackedBarsInputWindow[]>([]) as Ref<StackedBarsInputWindow[]>
	const timelineSessions = ref<ActivityTimelineSessions>(emptyTimelineSessions()) as Ref<ActivityTimelineSessions>

	/**
	 * Fragmentation: how the span's attention was shaped, as opposed to how much of it there was.
	 *
	 * Server-computed, on its own round. It used to be derived client-side from the timeline sessions,
	 * which cost no request but only worked on a single day — the timeline is not fetched over a range —
	 * and disagreed with the server on desktop, where the client keyed on the product label and the
	 * server keys on the process name. One definition, one source (U5b).
	 */
	const focusMetrics = ref<FocusMetricsResponse | null>(null) as Ref<FocusMetricsResponse | null>

	// --- Loading States ---
	const summaryCardsLoading = ref(false)
	const pieChartLoading = ref(false)
	const stackedBarsLoading = ref(false)
	const timelineLoading = ref(false)
	const focusMetricsLoading = ref(false)

	// --- Error States: quiet, per-panel — the axios interceptor's snackbar is suppressed for these
	// requests (`_silent: true`) so a failure surfaces only as this panel's own retry state. ---
	const summaryCardsError = ref(false)
	const pieChartError = ref(false)
	const stackedBarsError = ref(false)
	const timelineError = ref(false)
	const focusMetricsError = ref(false)

	const primarySessions = computed(() => timelineSessions.value.primarySessions)
	const detailSessions = computed(() => timelineSessions.value.detailSessions)
	const backgroundSessions = computed(() => timelineSessions.value.backgroundSessions)

	const range = computed<ActivityDashboardRange>(() => ({
		dateFrom: formatDateForApi(dateFrom.value),
		dateTo: formatDateForApi(dateTo.value),
		timeFrom: timeFrom.value,
		timeTo: timeTo.value,
	}))

	/**
	 * The outer envelope of the selected span, used by the timeline and by the pie chart's
	 * process-details lookup. The past-midnight rule is read off the *times*, not off the resulting
	 * Dates, so it behaves identically whether the span is one day or thirty.
	 */
	const timelineFrom = computed(() => {
		const d = new Date(dateFrom.value)
		d.setHours(timeFrom.value.hours, timeFrom.value.minutes, 0, 0)
		return d
	})

	const timelineTo = computed(() => {
		const d = new Date(dateTo.value)
		d.setHours(timeTo.value.hours, timeTo.value.minutes, 0, 0)
		if (timeTo.value.getInMinutes <= timeFrom.value.getInMinutes) {
			d.setDate(d.getDate() + 1)
		}
		return d
	})

	// --- Fetch Functions ---
	// Each holds the AbortController of its own in-flight round. A new round aborts the previous
	// one first, so a stale response can never paint over a newer one. The `finally` only clears
	// `loading` when this round is still the current one — a round that got superseded must not
	// clear the flag the newer round owns.
	let summaryCardsController: AbortController | null = null
	let pieChartController: AbortController | null = null
	let stackedBarsController: AbortController | null = null
	let timelineController: AbortController | null = null
	let focusMetricsController: AbortController | null = null

	// --- Empty-state probe: fired only after a round comes back empty on all four panels ---
	const emptyProbeState = ref<ActivityEmptyProbeState>('idle')
	let emptyProbeController: AbortController | null = null

	async function fetchSummaryCards() {
		summaryCardsController?.abort()
		const controller = new AbortController()
		summaryCardsController = controller
		summaryCardsLoading.value = true
		summaryCardsError.value = false
		try {
			const data = await fetchers.fetchSummaryCards(range.value, selectedBaseline.value, controller.signal)
			if (summaryCardsController === controller) {
				summaryCardsData.value = data
			}
		} catch (error) {
			if (isAbortError(error)) return
			summaryCardsError.value = true
		} finally {
			if (summaryCardsController === controller) {
				summaryCardsLoading.value = false
			}
		}
	}

	async function fetchPieChart() {
		pieChartController?.abort()
		const controller = new AbortController()
		pieChartController = controller
		pieChartLoading.value = true
		pieChartError.value = false
		try {
			const data = await fetchers.fetchPieChart(range.value, controller.signal)
			if (pieChartController === controller) {
				pieChartData.value = data
			}
		} catch (error) {
			if (isAbortError(error)) return
			pieChartError.value = true
		} finally {
			if (pieChartController === controller) {
				pieChartLoading.value = false
			}
		}
	}

	async function fetchStackedBars() {
		stackedBarsController?.abort()
		const controller = new AbortController()
		stackedBarsController = controller
		stackedBarsLoading.value = true
		stackedBarsError.value = false
		try {
			const data = await fetchers.fetchStackedBars(range.value, selectedWindowSize.value, controller.signal)
			if (stackedBarsController === controller) {
				stackedBarsWindows.value = data
			}
		} catch (error) {
			if (isAbortError(error)) return
			stackedBarsError.value = true
		} finally {
			if (stackedBarsController === controller) {
				stackedBarsLoading.value = false
			}
		}
	}

	/** Never called in range mode — see `isTimelineAvailable`. `clearTimeline` is the range-mode path. */
	async function fetchTimeline() {
		timelineController?.abort()
		const controller = new AbortController()
		timelineController = controller
		timelineLoading.value = true
		timelineError.value = false
		try {
			const data = await fetchers.fetchTimeline(range.value, controller.signal)
			if (timelineController === controller) {
				timelineSessions.value = data
			}
		} catch (error) {
			if (isAbortError(error)) return
			timelineError.value = true
		} finally {
			if (timelineController === controller) {
				timelineLoading.value = false
			}
		}
	}

	/**
	 * Unlike the timeline, this runs over a range too — working over a multi-day span is half of why
	 * the endpoint exists, and its response is four numbers rather than a month of sessions.
	 */
	async function fetchFocusMetrics() {
		focusMetricsController?.abort()
		const controller = new AbortController()
		focusMetricsController = controller
		focusMetricsLoading.value = true
		focusMetricsError.value = false
		try {
			const data = await fetchers.fetchFocusMetrics(range.value, selectedBaseline.value, controller.signal)
			if (focusMetricsController === controller) {
				focusMetrics.value = data
			}
		} catch (error) {
			if (isAbortError(error)) return
			focusMetricsError.value = true
		} finally {
			if (focusMetricsController === controller) {
				focusMetricsLoading.value = false
			}
		}
	}

	/**
	 * Drops the timeline instead of requesting it. Not just a rendering concern: a month of sessions
	 * is the largest response the module can ask for and nothing would display it.
	 */
	function clearTimeline() {
		timelineController?.abort()
		timelineController = null
		timelineSessions.value = emptyTimelineSessions()
		timelineLoading.value = false
		timelineError.value = false
	}

	/**
	 * True once every panel has settled without an error and none of them has anything to show.
	 *
	 * Deliberately does NOT consider `stackedBarsWindows`, even though it is one of the four panels: the
	 * endpoints may return windows whose `activities` array is empty, so a non-zero window count is not
	 * evidence of activity. Adding a `stackedBarsWindows.length === 0` term would make this return false
	 * on a genuinely empty span and suppress the empty state that explains why. If that ever changes,
	 * check the emptiness of the *items* inside the windows, never the window count.
	 */
	function isRoundEmpty(): boolean {
		return (
			!summaryCardsError.value &&
			!pieChartError.value &&
			!stackedBarsError.value &&
			!timelineError.value &&
			(summaryCardsData.value === null || summaryCardsData.value.length === 0) &&
			primarySessions.value.length === 0 &&
			detailSessions.value.length === 0 &&
			backgroundSessions.value.length === 0
		)
	}

	function isFullDayWindow(): boolean {
		return timeFrom.value.getInMinutes === 0 && timeTo.value.getInMinutes === 0
	}

	/**
	 * Fires only on an empty result, never speculatively. Re-requests the same span over 00:00-24:00
	 * to tell "nothing happened here" apart from "something happened outside the selected window".
	 */
	async function probeFullDayIfEmpty() {
		emptyProbeController?.abort()
		emptyProbeController = null

		if (!isRoundEmpty()) {
			emptyProbeState.value = 'idle'
			return
		}
		if (isFullDayWindow()) {
			emptyProbeState.value = 'emptyFullDay'
			return
		}

		emptyProbeState.value = 'checking'
		const controller = new AbortController()
		emptyProbeController = controller
		try {
			const fullDayRange: ActivityDashboardRange = {
				dateFrom: range.value.dateFrom,
				dateTo: range.value.dateTo,
				timeFrom: new Time(0, 0),
				timeTo: new Time(0, 0),
			}
			const data = await fetchers.fetchSummaryCards(fullDayRange, selectedBaseline.value, controller.signal)
			if (emptyProbeController !== controller) return
			emptyProbeState.value = data && data.length > 0 ? 'hasDataOutsideWindow' : 'emptyFullDay'
		} catch (error) {
			if (isAbortError(error)) return
			if (emptyProbeController === controller) {
				emptyProbeState.value = 'idle'
			}
		}
	}

	/** The one-click affordance offered when the probe finds data outside the current window. */
	function widenToFullDay() {
		timeFrom.value = new Time(0, 0)
		timeTo.value = new Time(0, 0)
	}

	/**
	 * The single write path for the span — the picker emits both dates at once, never one at a time.
	 * Clamped to the contract's 366-day cap here as well as in the picker, since this is also what a
	 * URL-seeded span and any future programmatic caller go through.
	 */
	function setDateSpan(from: Date, to: Date) {
		const end = to < from ? from : clampSpanEnd(from, to)
		if (isSameDay(dateFrom.value, from) && isSameDay(dateTo.value, end)) {
			return
		}
		dateFrom.value = from
		dateTo.value = end
	}

	// The initial run must keep a `selected` value that arrived via the URL rather than wipe it.
	let isInitialRun = true

	/**
	 * One full refresh of every panel. The fetches are independent — fired in parallel, not awaited in
	 * sequence, so one slow or failing endpoint never blocks the others. Only once all of them have
	 * settled do we know whether the round was empty and the full-day probe should fire.
	 *
	 * Exported because state the *view* owns can invalidate every panel at once: the unified
	 * dashboard's source selection changes what each endpoint returns, and re-running the five fetches
	 * by hand at that call site would be the same orchestration written twice.
	 */
	async function runRound() {
		if (isInitialRun) {
			isInitialRun = false
		} else {
			selectedItem.value = null
		}
		emptyProbeState.value = 'idle'

		const rounds = [fetchSummaryCards(), fetchPieChart(), fetchStackedBars(), fetchFocusMetrics()]
		if (isTimelineAvailable.value) {
			rounds.push(fetchTimeline())
		} else {
			clearTimeline()
		}
		await Promise.all(rounds)
		await probeFullDayIfEmpty()
	}

	// `timeFrom`/`timeTo` come from a range-picker that scrubs continuously, so debounce the whole
	// round; date changes are discrete but share the same watcher, and one uniform debounce is
	// simpler than splitting it.
	watchDebounced([dateFrom, dateTo, timeFrom, timeTo], runRound, {
		immediate: true,
		debounce: ACTIVITY_FETCH_DEBOUNCE_MS,
	})

	// Both panels carry a comparison against the selected baseline, so both have to re-fetch — leaving
	// the strip out would let its "typically …" figures go stale the moment the selector changes.
	watch(selectedBaseline, () => {
		fetchSummaryCards()
		fetchFocusMetrics()
	})

	// A span change can invalidate the selected window size (30 minutes is not on offer for a month).
	// This is the only place that decides the replacement — the chart adopts it through
	// `initialWindowSize` — so the two cannot disagree about which size the next fetch used.
	//
	// Coming back to a single day prefers the historical default over the finest option, so a detour
	// through a range does not silently leave the day view on 15-minute windows.
	watch(windowSizeOptions, () => {
		selectedWindowSize.value = clampWindowSize(selectedWindowSize.value)
	})

	// --- URL sync: reflect bookmarkable state, omitting anything at its default ---
	function syncQueryToUrl() {
		const query: LocationQueryRaw = { ...route.query }

		const dateFromStr = formatDateForApi(dateFrom.value)
		if (dateFromStr === formatDateForApi(new Date())) {
			delete query[DATE_PARAM]
		} else {
			query[DATE_PARAM] = dateFromStr
		}

		// Omitted for a single day, which keeps every pre-range URL byte-identical to what it was.
		//
		// Known cosmetic gap: this watcher is not `immediate`, so opening a `?dateTo=…` link while range
		// mode is off leaves the now-ignored param sitting in the address bar until the first interaction
		// clears it. Making the sync immediate would fire a `router.replace` on every mount, which the
		// pre-range code deliberately avoided — not worth trading for this.
		if (isRangeMode.value) {
			query[DATE_TO_PARAM] = formatDateForApi(dateTo.value)
		} else {
			delete query[DATE_TO_PARAM]
		}

		if (timeFrom.value.getInMinutes === DEFAULT_TIME_FROM.getInMinutes) {
			delete query[FROM_PARAM]
		} else {
			query[FROM_PARAM] = timeFrom.value.getString()
		}

		if (timeTo.value.getInMinutes === DEFAULT_TIME_TO.getInMinutes) {
			delete query[TO_PARAM]
		} else {
			query[TO_PARAM] = timeTo.value.getString()
		}

		// The user's own choice, not the effective one: a range forces stacked bars, and writing that
		// to the URL would silently discard a timeline preference the moment a range is picked.
		if (selectedVisualization.value === DEFAULT_VISUALIZATION) {
			delete query[VIEW_PARAM]
		} else {
			query[VIEW_PARAM] = selectedVisualization.value
		}

		if (selectedBaseline.value === DEFAULT_BASELINE) {
			delete query[BASELINE_PARAM]
		} else {
			query[BASELINE_PARAM] = selectedBaseline.value
		}

		if (selectedWindowSize.value === DEFAULT_WINDOW_SIZE) {
			delete query[WINDOW_PARAM]
		} else {
			query[WINDOW_PARAM] = String(selectedWindowSize.value)
		}

		if (selectedItem.value === null) {
			delete query[SELECTED_PARAM]
		} else {
			query[SELECTED_PARAM] = selectedItem.value
		}

		// The view's own params last, so a view can override a built-in key if it ever needs to.
		for (const [key, value] of Object.entries(options.extraQuery?.value ?? {})) {
			if (value === undefined || value === null) {
				delete query[key]
			} else {
				query[key] = value
			}
		}

		router.replace({ query }).catch(() => {
			// navigation duplication / redirection errors are non-fatal for state sync
		})
	}

	watch(
		[
			dateFrom,
			dateTo,
			timeFrom,
			timeTo,
			selectedVisualization,
			selectedBaseline,
			selectedWindowSize,
			selectedItem,
			// A computed rebuilding its object on every dependency change, so reference equality is
			// enough to notice — no deep watch needed.
			() => options.extraQuery?.value,
		],
		syncQueryToUrl,
	)

	// --- Event Handlers ---
	function handleBaselineChange(value: BaselineType) {
		selectedBaseline.value = value
	}

	/** Selecting the already-selected item clears the selection. */
	function handleItemSelect(name: string) {
		selectedItem.value = selectedItem.value === name ? null : name
	}

	function handleWindowSizeChange(size: number) {
		if (selectedWindowSize.value === size) return
		selectedWindowSize.value = size
		fetchStackedBars()
	}

	function handleActivityClick(_window: StackedBarsInputWindow, name: string) {
		handleItemSelect(name)
	}

	function handleSessionClick(session: TimelineSessionDto) {
		handleItemSelect(session.domain)
	}

	return {
		dateFrom,
		dateTo,
		timeFrom,
		timeTo,
		// The formatted scope every request is made against, so a panel a view adds on top of the
		// shared four asks for the same span rather than re-deriving it from the four refs.
		range,
		dayCount,
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
	}
}
