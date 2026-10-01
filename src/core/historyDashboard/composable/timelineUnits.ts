import type { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
import type { ActivityHistorySession } from '@/core/activityHistory/dto/response/ActivityHistorySession.ts'
import { TimerSessionKind } from '@/core/activityHistory/dto/enum/TimerSessionKind.ts'

/**
 * What the day's timeline draws: a plain row, or a pomodoro session folded into one unit.
 *
 * Only a **pomodoro** session is folded. A countdown session is exactly one row, so folding it would
 * wrap one card in another; it stays a row, and the row says how it ended. A row with no session —
 * every row written before sessions existed, and every stopwatch, manual and tracked row — is its own
 * unit, exactly as it always rendered.
 */
export type TimelineUnit =
	| { kind: 'record'; key: string; start: Date; record: ActivityHistory }
	| { kind: 'session'; key: string; start: Date; session: ActivityHistorySession; records: ActivityHistory[] }

/**
 * Folds each pomodoro session's rows into one unit, placed where its first row was.
 *
 * The rows arrive in start order, and a row of something else can land between two phases of a
 * session (a tracked stretch during a break); the session still reads as one unit, at the moment it
 * began, rather than being split around it.
 */
export function groupTimelineUnits(records: ActivityHistory[]): TimelineUnit[] {
	const units: TimelineUnit[] = []
	const sessionUnits = new Map<number, Extract<TimelineUnit, { kind: 'session' }>>()

	for (const record of records) {
		const session = record.session
		if (session === null || session.kind !== TimerSessionKind.Pomodoro) {
			units.push({ kind: 'record', key: `record-${record.id}`, start: record.startTimestamp, record })
			continue
		}
		const existing = sessionUnits.get(session.id)
		if (existing) {
			existing.records.push(record)
			continue
		}
		const unit = {
			kind: 'session' as const,
			key: `session-${session.id}`,
			start: record.startTimestamp,
			session,
			records: [record],
		}
		sessionUnits.set(session.id, unit)
		units.push(unit)
	}
	return units
}
