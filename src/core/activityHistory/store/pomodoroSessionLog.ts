import type { PomodoroPhase, PomodoroSession, TimerOutcome } from '@/core/activityHistory/store/runningTimerStore.ts'

/**
 * Reading a pomodoro's segment log: the phases as they actually ran, how far the plan got, and the
 * rows the session will be saved as.
 *
 * Pure and store-free, like `timerBoundaries.ts`, so the rules below can be pinned by tests without a
 * clock. Every function answers `null` for a session with no log (one stored before the log
 * existed) rather than guessing from the accumulators — see `PomodoroSession.segments`.
 */

/** Seconds per minute, in ms — the wire's granularity (`Time` / the server's `IntTime`). */
const MS_PER_MINUTE = 60_000

/** One phase as it ran: its segments merged back together. */
export interface PomodoroPhaseSpan {
	phase: PomodoroPhase
	/** Epoch ms — the phase's real start. */
	startedAt: number
	/**
	 * Epoch ms — the end of its last segment. For a phase the user paused through this is later
	 * than `startedAt + elapsedMs`: the pause is inside the span but was never credited.
	 */
	endedAt: number
	/** The credited time: what the accumulators banked for this phase, pauses excluded. */
	elapsedMs: number
	/** Ran its full planned length (possibly while the app was closed — see `reconcile()`). */
	completed: boolean
}

/**
 * The log folded into phases. A pause splits a phase into segments but not into two phases — a rest
 * the user paused through is still one rest — so segments merge until one is closed by a boundary.
 */
export function pomodoroPhaseSpans(session: PomodoroSession): PomodoroPhaseSpan[] | null {
	if (session.segments === undefined) return null
	const spans: PomodoroPhaseSpan[] = []
	let open: PomodoroPhaseSpan | null = null
	for (const segment of session.segments) {
		if (open === null) {
			open = {
				phase: segment.phase,
				startedAt: segment.startedAt,
				endedAt: segment.endedAt,
				elapsedMs: 0,
				completed: false,
			}
			spans.push(open)
		}
		open.endedAt = segment.endedAt
		open.elapsedMs += segment.endedAt - segment.startedAt
		if (segment.closedBy === 'boundary') {
			open.completed = true
			open = null
		}
	}
	return spans
}

/** How an ended pomodoro went, in the terms the user set it up in. */
export interface PomodoroOutcomeSummary {
	outcome: TimerOutcome
	/** Focus periods that ran their full length. A focus period cut short by Stop is not one. */
	focusPeriodsCompleted: number
	focusPeriodsPlanned: number
}

export function pomodoroOutcomeSummary(session: PomodoroSession): PomodoroOutcomeSummary | null {
	const spans = pomodoroPhaseSpans(session)
	if (spans === null || session.outcome == null) return null
	return {
		outcome: session.outcome,
		focusPeriodsCompleted: spans.filter(span => span.phase === 'focus' && span.completed).length,
		focusPeriodsPlanned: session.totalCycles * session.focusPeriodsPerCycle,
	}
}

/**
 * Whole minutes per part, summing to exactly the rounded whole — largest remainder, ties to the
 * earlier part.
 *
 * This is the rounding rule for saving a session as several rows. Rounding each part on its own
 * makes the rows disagree with the total the save dialog quoted (four 24m40s phases are 4 × 25m =
 * 100m against a quoted 99m), so the **total is authoritative**: it is rounded the way every other
 * session is (`sessionLengthFromMs`, half-up at 30 seconds) and the parts share it out. A part that
 * gets zero minutes is not dropped *time* — its seconds went into a neighbour's rounding — it is just
 * a part with nothing left to record, and `planPomodoroRows` leaves it out rather than send the
 * zero-length row the API refuses (B17).
 */
export function apportionMinutes(partsMs: number[]): number[] {
	const exact = partsMs.map(ms => Math.max(0, ms) / MS_PER_MINUTE)
	const minutes = exact.map(value => Math.floor(value))
	const totalMs = partsMs.reduce((sum, ms) => sum + Math.max(0, ms), 0)
	let left = Math.round(totalMs / MS_PER_MINUTE) - minutes.reduce((sum, value) => sum + value, 0)

	const byRemainder = exact
		.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
		.sort((a, b) => b.remainder - a.remainder || a.index - b.index)
	for (const { index } of byRemainder) {
		if (left <= 0) break
		minutes[index]!++
		left--
	}
	return minutes
}

/** One history row a pomodoro session will be saved as. */
export interface PomodoroRowPlan {
	activityId: number
	phase: PomodoroPhase
	/** Epoch ms — the phase's real start, not the session's. */
	startedAt: number
	/** ≥ 1. */
	minutes: number
}

/**
 * The rows a pomodoro is saved as once the API can hold a session: one per focus period against the
 * focus activity, one per break against the rest activity, each dated at its real start.
 *
 * - **No rest activity, no rest rows** — as today. The breaks are then the gaps between focus rows,
 *   which is honest.
 * - **Focus and rest are apportioned separately**, because they are two totals against two
 *   activities and each must match what it is quoted as.
 * - **Rows never overlap** except by less than the minute of rounding: a row's credited length is
 *   never longer than its phase's wall-clock span, and the next phase starts where this one ended.
 *   The API accepts that sub-minute overlap and does not clamp it (B3 rule 6).
 * - **Strictly increasing starts**, which the API requires: phases run one after another, so no two
 *   share an instant.
 */
export function planPomodoroRows(session: PomodoroSession): PomodoroRowPlan[] | null {
	const spans = pomodoroPhaseSpans(session)
	if (spans === null || session.activityId === null) return null

	function rowsFor(activityId: number, phases: PomodoroPhaseSpan[]): PomodoroRowPlan[] {
		const minutes = apportionMinutes(phases.map(span => span.elapsedMs))
		return phases
			.map((span, i) => ({ activityId, phase: span.phase, startedAt: span.startedAt, minutes: minutes[i]! }))
			.filter(row => row.minutes > 0)
	}

	const focus = rowsFor(
		session.activityId,
		spans.filter(span => span.phase === 'focus'),
	)
	const rest =
		session.restActivityId === null
			? []
			: rowsFor(
					session.restActivityId,
					spans.filter(span => span.phase !== 'focus'),
				)
	return [...focus, ...rest].sort((a, b) => a.startedAt - b.startedAt)
}

/** The most rows `POST /activity-history/session` takes in one session — the API's validation limit. */
export const MAX_SESSION_RECORDS = 64

/**
 * The plan cut to what one session request may carry, or null when it cannot be cut honestly.
 *
 * Reachable: the setup panel allows 6 cycles × 6 focus periods (71 phases with a rest activity), and a
 * preset has no upper bound at all. The break rows go first — the breaks are then the gaps between
 * focus rows, exactly what a session with no rest activity already looks like. Focus rows are the
 * ones the user confirmed in the save dialog, so they are never dropped: past the cap even without
 * breaks, the answer is null and the caller saves the summed rows instead.
 */
export function fitToRecordCap(rows: PomodoroRowPlan[]): PomodoroRowPlan[] | null {
	if (rows.length <= MAX_SESSION_RECORDS) return rows
	const focusOnly = rows.filter(row => row.phase === 'focus')
	return focusOnly.length <= MAX_SESSION_RECORDS ? focusOnly : null
}
