import { Time } from '@/_common/dto/dto/Time.ts'
import { TimerBoundaryPhase } from '@/core/activityHistory/dto/enum/TimerBoundaryPhase.ts'
// `import type` on purpose: the store imports the schedule, which imports this file, so a *value*
// import back into the store would close a runtime cycle. Types are erased, so this one is free.
import type { PomodoroSession, TimerKind, TimerSession } from '@/core/activityHistory/store/runningTimerStore.ts'

/**
 * Every instant a running session will ring by itself, and where in the cycle each one sits.
 *
 * This exists because the alarm has to be scheduled somewhere that is not this tab. `runningTimerStore`
 * fires its alarm from a `setTimeout`, so closing the laptop lid on a 25-minute focus phase means
 * nothing rings — the session survives (that is what H9 bought), but the moment it was for is gone.
 * The fix is a server-side push per boundary, and a push has to be registered *ahead* of the instant
 * it fires, which means knowing every boundary up front rather than at the boundary.
 *
 * ## Scheduling the whole pomodoro cycle at start, not one phase at a time
 *
 * The focus / short / long durations, the focus-periods-per-cycle and the cycle count are all frozen
 * when Start is pressed, so every boundary of the whole run is computable at that instant.
 * Rescheduling at each transition would mean the *next* alarm is registered by the tab, at the moment
 * the previous one fires — i.e. by exactly the live tab whose absence is the bug. A user who closes
 * the lid during focus period 1 would get one push and then silence for the rest of the cycle, which
 * is the failure this is supposed to fix, only later.
 *
 * The cost is that a pause reshuffles everything: a paused session has no boundaries at all (below),
 * and resuming re-posts the full set at the shifted instants. Posting is a whole-set replace keyed by
 * session id, so that is one request, not a reconciliation.
 *
 * ## No text here any more
 *
 * The first cut of this file also composed the notification title and body for each boundary and
 * shipped them to the server. The backend words the background push itself, from `phase` plus the
 * index fields, the way it words its eighteen other notification types — free-form pre-rendered text
 * has no transport path there. So this projection is now purely structural, and the app's
 * `history.timer.*` / `history.pomodoro.*` bundles are used only for the in-page notification a live
 * tab shows itself (see `announceEnd` and `advancePomodoro` in the store).
 */
export interface TimerBoundary {
	/** Epoch ms the alarm fires. Absolute, and the only thing either side schedules on. */
	at: number
	phase: TimerBoundaryPhase
	/** 1-based focus period within the cycle; null for a countdown. */
	phaseIndex: number | null
	phaseTotal: number | null
	/** 1-based cycle within the run; null for a countdown. */
	cycleIndex: number | null
	cycleTotal: number | null
}

/** Where `notificationclick` sends the user — the routed page for the kind that rang. */
const TIMER_ROUTE_PATH: Record<TimerKind, string> = {
	stopwatch: '/activity-history/stopwatch',
	timer: '/activity-history/timer',
	pomodoro: '/activity-history/pomodoro',
}

export function timerRoutePath(kind: TimerKind): string {
	return TIMER_ROUTE_PATH[kind]
}

/** Whole minutes, for the in-page notification bodies. Sessions are set in minutes, so this is exact. */
export function niceDuration(ms: number): string {
	return Time.fromMinutes(Math.round(ms / 60_000)).getNice
}

/**
 * A pathological session (a preset with a zero-length phase, say) must not spin here. Well past any
 * real cycle, and past the API's own cap of 64 — see `clampToContract`.
 */
const MAX_BOUNDARIES = 200

/**
 * The boundaries `current` still has ahead of it, in order, or an empty list when it has none.
 *
 * Empty is the answer for every state that cannot ring by itself, and callers rely on that: a
 * **stopwatch** has no end and one must not be invented for it; a **paused** session has no end
 * instant at all (it stores what is left, not when it lands — see the store's `pauseSession`), so
 * its schedule has to go away and come back on resume; an **ended** session has already rung.
 * That uniformity is what lets the store call this after every transition and compare the result,
 * rather than each transition knowing what it does to the schedule.
 */
export function projectBoundaries(current: TimerSession): TimerBoundary[] {
	if (current.ended || current.paused || current.kind === 'stopwatch') return []
	if (current.endsAt === null) return []

	if (current.kind === 'timer') {
		return [
			{
				at: current.endsAt,
				phase: TimerBoundaryPhase.Plain,
				phaseIndex: null,
				phaseTotal: null,
				cycleIndex: null,
				cycleTotal: null,
			},
		]
	}
	return pomodoroBoundaries(current)
}

/**
 * Which phase a pomodoro is in, for a *projected* state rather than the live one.
 *
 * Same rule as the store's exported `pomodoroPhaseOf` and deliberately not a call to it — see the
 * import note at the top. Two lines is a cheaper price than a runtime import cycle.
 */
function phaseOf(isFocus: boolean, period: number, focusPeriodsPerCycle: number): TimerBoundaryPhase {
	if (isFocus) return TimerBoundaryPhase.Focus
	return period === focusPeriodsPerCycle ? TimerBoundaryPhase.LongBreak : TimerBoundaryPhase.ShortBreak
}

/**
 * Walk the pomodoro state machine forward from wherever it is now.
 *
 * This is `advancePomodoro`'s transition rules replayed without mutating anything, and the two have
 * to stay in step: the period counter advances on the way back *into* focus, the cycle counter on
 * the way into a long break, and the session ends after the last focus period of the last cycle —
 * the final long break never happens.
 *
 * **The last boundary is therefore a `Focus` one with `phaseIndex === phaseTotal` and
 * `cycleIndex === cycleTotal`, and that combination is the only thing marking it as the end of the
 * whole run** rather than another "time for a break". There is no flag in the contract for it; the
 * indices carry it. See the open item in `prompts/activity-history/backend/H11-backend.md`.
 */
function pomodoroBoundaries(current: PomodoroSession): TimerBoundary[] {
	const boundaries: TimerBoundary[] = []

	let at = current.endsAt!
	let isFocus = current.isFocus
	let cycle = current.currentCycle
	let period = current.currentFocusPeriod

	while (boundaries.length < MAX_BOUNDARIES) {
		boundaries.push({
			at,
			phase: phaseOf(isFocus, period, current.focusPeriodsPerCycle),
			phaseIndex: period,
			phaseTotal: current.focusPeriodsPerCycle,
			cycleIndex: cycle,
			cycleTotal: current.totalCycles,
		})

		const wasEndOfCycle = period === current.focusPeriodsPerCycle
		isFocus = !isFocus
		if (cycle === current.totalCycles && wasEndOfCycle && !isFocus) break

		if (isFocus) {
			at += current.focusMs
			period = wasEndOfCycle ? 1 : period + 1
		} else if (wasEndOfCycle) {
			at += current.longRestMs
			cycle++
		} else {
			at += current.shortRestMs
		}
	}
	return boundaries
}
