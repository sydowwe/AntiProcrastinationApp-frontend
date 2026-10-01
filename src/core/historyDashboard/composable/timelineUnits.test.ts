import { describe, expect, it } from 'vitest'
import { groupTimelineUnits } from '@/core/historyDashboard/composable/timelineUnits.ts'
import { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'

const T0 = Date.parse('2026-09-29T08:00:00.000Z')
const MINUTE = 60_000

function row(id: number, offsetMinutes: number, extra: Record<string, unknown> = {}): ActivityHistory {
	return ActivityHistory.fromJson({
		id,
		startTimestamp: new Date(T0 + offsetMinutes * MINUTE).toISOString(),
		length: { hours: 0, minutes: 5 },
		activity: { id: 7, name: 'Reading', role: { id: 1, name: 'Work' } },
		...extra,
	})
}

const pomodoro = { id: 88, kind: 'Pomodoro', outcome: 'StoppedEarly', plannedFocusPeriods: 4, completedFocusPeriods: 1 }
const timer = { id: 89, kind: 'Timer', outcome: 'Completed', plannedFocusPeriods: null, completedFocusPeriods: null }

describe('groupTimelineUnits', () => {
	it('reads the session and phase off the wire into client enums', () => {
		const record = row(1, 0, { phase: 'ShortBreak', session: pomodoro })
		expect(record.phase).toBe('shortBreak')
		expect(record.session).toMatchObject({
			id: 88,
			kind: 'pomodoro',
			outcome: 'stoppedEarly',
			completedFocusPeriods: 1,
		})
		expect(row(2, 0).session).toBeNull()
	})

	it('folds a pomodoro session into one unit at its first row, even around a row of something else', () => {
		const units = groupTimelineUnits([
			row(1, 0, { phase: 'Focus', session: pomodoro }),
			row(2, 25, { phase: 'ShortBreak', session: pomodoro }),
			row(3, 27),
			row(4, 30, { phase: 'Focus', session: pomodoro }),
		])

		expect(units.map(unit => unit.key)).toEqual(['session-88', 'record-3'])
		const session = units[0]!
		expect(session.kind === 'session' && session.records.map(r => r.id)).toEqual([1, 2, 4])
		expect(session.start.getTime()).toBe(T0)
	})

	it('leaves a countdown session and a session-less row as plain rows', () => {
		const units = groupTimelineUnits([row(1, 0, { session: timer }), row(2, 10)])
		expect(units.map(unit => unit.kind)).toEqual(['record', 'record'])
	})
})
