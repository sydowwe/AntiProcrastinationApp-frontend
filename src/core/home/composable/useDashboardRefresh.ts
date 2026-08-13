import { computed, effectScope, onMounted, onUnmounted, ref, watch } from 'vue'
import type { EffectScope, Ref } from 'vue'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'

/**
 * One place that decides WHEN the home dashboard refetches.
 *
 * Every widget used to fetch once in `onMounted` and never again, on a page people leave open in a
 * pinned tab all day. The clock kept ticking underneath, so the UI looked alive while the data was
 * hours old — complete a task on your phone and this page never noticed.
 *
 * Widgets subscribe with their own loader and their own policy; this module owns the triggers:
 *
 * 1. **The tab becomes visible again** — the highest-value trigger by far, because it fires exactly
 *    when somebody is about to look at the page. Gated on staleness so alt-tabbing twice a minute is
 *    not two refetches.
 * 2. **Day rollover** — `todayIsoDate` below is the single date signal every widget derives from, so
 *    they all flip on the same edge instead of each freezing a `new Date()` at setup.
 * 3. **Coming back online** — retries only the subscribers currently showing an error.
 * 4. **A slow backstop poll** — opt-in per widget, in minutes, and paused entirely while hidden.
 *
 * Deliberately NOT here: `window.focus`. On some setups it fires alongside `visibilitychange` and
 * every trigger doubles.
 *
 * The listeners are registered once for the whole module and fan out, not once per subscriber —
 * six widgets must not mean six copies of the same document-level handler. They are wired when the
 * first subscriber mounts and removed when the last one unmounts, so navigating away from home
 * leaves nothing behind.
 */

/** How old data must be before returning to the tab is worth a refetch. */
const DEFAULT_STALE_AFTER_MS = 2 * 60_000

export interface DashboardRefreshOptions {
	/**
	 * Background refetch. Must keep the current content on screen — never blank the widget to a
	 * spinner, and never clear an existing error state until it succeeds.
	 */
	refresh: () => unknown
	/** First fetch, run on mount. This one owns the spinner; omit if the widget loads itself. */
	load?: () => unknown
	/** Whether the widget is currently in an error state — drives the `online` retry. */
	hasError?: () => boolean
	/** Age at which the visibility trigger fires. */
	staleAfterMs?: number
	/** Backstop poll period. Omit for data that only changes through user action. */
	intervalMinutes?: number
	/** Refetch on day rollover. On by default — most of this dashboard is date-scoped. */
	onDayChange?: boolean
	/** Refetch when a time-tracking session finishes anywhere on the page. */
	onTrackingSession?: boolean
}

/**
 * One entry per `key`, not per calling component: the now bar and the planner widget are two views
 * of one plan, and a single visibility change must refetch it once, not twice.
 */
interface RefreshEntry {
	/** Mounted components holding this key. The entry dies with the last one. */
	consumers: number
	refresh: () => unknown
	hasError: () => boolean
	staleAfterMs: number
	intervalMs: number
	onDayChange: boolean
	onTrackingSession: boolean
	lastRefreshedAt: number
	inFlight: boolean
}

const entries = new Map<string, RefreshEntry>()

// --- the shared date signal --------------------------------------------------
// Every date-scoped value on this page reads from here. A widget that captures `new Date()` at
// setup is wrong by morning: the routine list filters for yesterday's weekday and the history
// request asks for yesterday's date.
const todayIso = ref(formatDateForApi(new Date()))
/** Local `YYYY-MM-DD`, kept current for as long as the dashboard is mounted. */
export const todayIsoDate = computed(() => todayIso.value)
/** The same day as a local-midnight `Date`, for day-of-week / day-of-month / day-diff maths. */
export const todayDate = computed(() => {
	const [year, month, day] = todayIso.value.split('-').map(Number)
	return new Date(year!, month! - 1, day!)
})

/** A rollover that happened while nobody was looking, held until the tab is visible again. */
let dayChangePending = false

// --- fan-out -----------------------------------------------------------------
function runRefresh(entry: RefreshEntry) {
	// A slow refresh must not accumulate a queue of duplicates behind it.
	if (entry.inFlight) return
	entry.inFlight = true
	void Promise.resolve()
		.then(() => entry.refresh())
		// Loaders own their own error state; there is nothing useful to add from out here.
		.catch(() => {})
		.finally(() => {
			entry.inFlight = false
			// Stamped on completion of the *attempt*, not of a successful one — loaders swallow their
			// own failures, so success is not observable from here. The consequence is deliberate: a
			// widget that failed counts as fresh for one staleness window, which is what stops ten
			// alt-tabs against a down backend from becoming ten rounds of requests. Recovery comes
			// from the `online` trigger and the widget's own Retry button, not from this clock.
			entry.lastRefreshedAt = Date.now()
		})
}

function refreshStale() {
	const nowMs = Date.now()
	for (const entry of entries.values()) {
		if (nowMs - entry.lastRefreshedAt >= entry.staleAfterMs) runRefresh(entry)
	}
}

function fanOutDayChange() {
	dayChangePending = false
	for (const entry of entries.values()) {
		if (entry.onDayChange) runRefresh(entry)
	}
}

function syncDate() {
	const iso = formatDateForApi(new Date())
	if (iso === todayIso.value) return
	// Set first, fan out second: the loaders read date-derived computeds and must see the new day.
	todayIso.value = iso
	if (document.hidden) {
		// Firing four requests at midnight into a tab nobody is looking at buys nothing. Hold the
		// refetch; `handleVisibilityChange` runs it when it starts to matter.
		dayChangePending = true
		return
	}
	fanOutDayChange()
}

/**
 * A time-tracking session finished. The history aggregates changed and no request said so — the
 * only signal is the dialog that ran it, and that dialog lives in a different widget.
 */
export function notifyTrackingSessionFinished(): void {
	for (const entry of entries.values()) {
		if (entry.onTrackingSession) runRefresh(entry)
	}
}

// --- triggers ----------------------------------------------------------------
function handleVisibilityChange() {
	if (document.hidden) return
	syncDate()
	if (dayChangePending) fanOutDayChange()
	refreshStale()
}

function handleOnline() {
	for (const entry of entries.values()) {
		if (entry.hasError()) runRefresh(entry)
	}
}

/**
 * The backstop poll. It rides the framework's existing one-minute clock rather than starting a
 * timer of its own — that clock is already running to drive the countdowns on this very page, and
 * it refcounts itself down to nothing when the last consumer unmounts.
 */
function handleTick() {
	syncDate()
	if (document.hidden) return
	const nowMs = Date.now()
	for (const entry of entries.values()) {
		if (entry.intervalMs > 0 && nowMs - entry.lastRefreshedAt >= entry.intervalMs) runRefresh(entry)
	}
}

// --- module lifecycle --------------------------------------------------------
// Detached, like `useTodayPlan`'s: none of this may be owned by a component, because a handler
// created inside whichever widget happened to mount first would die with that widget while the
// registry it serves lives on.
let scope: EffectScope | null = null

function wire(currentTime: Ref<Date>) {
	if (scope) return
	// Silent: the caller is the first subscriber and is loading fresh data right now anyway, so a
	// date that moved while the dashboard was unmounted is not a rollover anyone needs refetched.
	todayIso.value = formatDateForApi(new Date())
	dayChangePending = false

	scope = effectScope(true)
	scope.run(() => watch(currentTime, handleTick))
	document.addEventListener('visibilitychange', handleVisibilityChange)
	window.addEventListener('online', handleOnline)
}

function unwire() {
	scope?.stop()
	scope = null
	document.removeEventListener('visibilitychange', handleVisibilityChange)
	window.removeEventListener('online', handleOnline)
}

// HMR swaps this module for a fresh copy with a fresh registry; without this the previous copy's
// listeners keep firing refreshes into widgets nothing renders any more.
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		entries.clear()
		unwire()
	})
}

/**
 * Subscribe a widget to the dashboard's refresh triggers.
 *
 * `key` identifies the *data*, not the component: two components showing one dataset pass the same
 * key and share one entry, so each trigger refetches it once.
 */
export function useDashboardRefresh(key: string, options: DashboardRefreshOptions) {
	// Called per consumer, not once: the framework clock refcounts its interval by mounted instance,
	// and `handleTick` is only as alive as that clock.
	const { currentTime } = useCurrentTime()

	onMounted(() => {
		const existing = entries.get(key)
		if (existing) {
			existing.consumers++
			existing.lastRefreshedAt = Date.now()
		} else {
			entries.set(key, {
				consumers: 1,
				refresh: options.refresh,
				hasError: options.hasError ?? (() => false),
				staleAfterMs: options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS,
				intervalMs: (options.intervalMinutes ?? 0) * 60_000,
				onDayChange: options.onDayChange ?? true,
				onTrackingSession: options.onTrackingSession ?? false,
				lastRefreshedAt: Date.now(),
				inFlight: false,
			})
		}
		if (entries.size === 1) wire(currentTime)
		// Last, so nothing above can race the first fetch into a duplicate.
		options.load?.()
	})

	onUnmounted(() => {
		const entry = entries.get(key)
		if (!entry) return
		entry.consumers--
		if (entry.consumers <= 0) entries.delete(key)
		if (entries.size === 0) unwire()
	})

	return {
		/** Refresh this subscriber now, bypassing every staleness check. */
		refreshNow() {
			const entry = entries.get(key)
			if (entry) runRefresh(entry)
		},
	}
}
