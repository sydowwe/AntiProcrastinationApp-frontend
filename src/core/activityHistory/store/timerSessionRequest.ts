import { Time } from '@/_common/dto/dto/Time.ts'
import { getEnumKeyByValue } from '@/_common/utils/enumHelpers.ts'
import {
	ActivityHistorySessionRecordRequest,
	ActivityHistorySessionRequest,
} from '@/core/activityHistory/dto/request/ActivityHistorySessionRequest.ts'
import { TimerSessionKind } from '@/core/activityHistory/dto/enum/TimerSessionKind.ts'
import { TimerSessionOutcome } from '@/core/activityHistory/dto/enum/TimerSessionOutcome.ts'
import { TimerSessionPhase } from '@/core/activityHistory/dto/enum/TimerSessionPhase.ts'
import {
	fitToRecordCap,
	planPomodoroRows,
	pomodoroOutcomeSummary,
} from '@/core/activityHistory/store/pomodoroSessionLog.ts'
import type { CountdownSession, PomodoroSession } from '@/core/activityHistory/store/runningTimerStore.ts'

/**
 * A finished session from the running-timer store, as the `POST /activity-history/session` body.
 *
 * Both builders answer null when the session cannot be written as a session, and the caller then
 * saves the way it did before sessions existed. That happens for a session stored before the segment
 * log or the outcome existed, which cannot say which phases ran or how it ended, and for a pomodoro
 * too long for one request even without its breaks (`fitToRecordCap`). Null never means "save
 * nothing".
 */

/** The API's member name for a client enum value — the wire spelling `fromJson` reads back. */
function wireName<T extends Record<string, string>>(enumObject: T, value: string): string | null {
	return (getEnumKeyByValue(enumObject, value) as string | undefined) ?? null
}

/**
 * A plan in the wire's whole minutes, or null when it has none to send. The pickers only set whole
 * minutes, so the rounding is a guard, not a rule; a zero would be refused by the API.
 */
function plannedLength(ms: number): Time | null {
	const minutes = Math.round(ms / 60_000)
	return minutes > 0 ? Time.fromMinutes(minutes) : null
}

export function pomodoroSessionRequest(session: PomodoroSession): ActivityHistorySessionRequest | null {
	const summary = pomodoroOutcomeSummary(session)
	const planned = planPomodoroRows(session)
	if (summary === null || planned === null) return null
	const rows = fitToRecordCap(planned)
	const outcome = wireName(TimerSessionOutcome, summary.outcome)
	if (rows === null || rows.length === 0 || outcome === null) return null

	return new ActivityHistorySessionRequest(
		wireName(TimerSessionKind, TimerSessionKind.Pomodoro)!,
		outcome,
		summary.focusPeriodsPlanned,
		summary.focusPeriodsCompleted,
		// The focus the plan asked for, comparable with the focus rows' total. Breaks are left out:
		// "stopped after 12 of 100 minutes" is about the work, not the rests between it.
		plannedLength(session.focusMs * summary.focusPeriodsPlanned),
		rows.map(
			row =>
				new ActivityHistorySessionRecordRequest(
					row.activityId,
					new Date(row.startedAt),
					Time.fromMinutes(row.minutes),
					wireName(TimerSessionPhase, row.phase),
				),
		),
	)
}

/**
 * A countdown is a session of one row. `startTimestamp` and `length` are passed in rather than
 * re-derived, so the row is exactly the one the save dialog quoted.
 */
export function countdownSessionRequest(
	session: CountdownSession,
	startTimestamp: Date,
	length: Time,
): ActivityHistorySessionRequest | null {
	if (session.activityId === null || session.outcome == null) return null
	const outcome = wireName(TimerSessionOutcome, session.outcome)
	if (outcome === null) return null

	return new ActivityHistorySessionRequest(
		wireName(TimerSessionKind, TimerSessionKind.Timer)!,
		outcome,
		null,
		null,
		plannedLength(session.durationMs),
		[new ActivityHistorySessionRecordRequest(session.activityId, startTimestamp, length, null)],
	)
}
