import { describe, expect, it } from 'vitest'
import {
	apportionMinutes,
	planPomodoroRows,
	pomodoroPhaseSpans,
} from '@/core/activityHistory/store/pomodoroSessionLog.ts'
import type { PomodoroSegment, PomodoroSession } from '@/core/activityHistory/store/runningTimerStore.ts'

const SECOND = 1_000
const MINUTE = 60 * SECOND
const T0 = new Date('2026-08-20T09:00:00.000Z').getTime()

function session(segments: PomodoroSegment[] | undefined, overrides: Partial<PomodoroSession> = {}): PomodoroSession {
	return {
		kind: 'pomodoro',
		startedAtEpoch: T0,
		pinnedActivityId: null,
		activityId: 7,
		activityName: 'Reading',
		paused: false,
		ended: true,
		outcome: 'completed',
		focusMs: 25 * MINUTE,
		shortRestMs: 5 * MINUTE,
		longRestMs: 15 * MINUTE,
		focusPeriodsPerCycle: 4,
		totalCycles: 1,
		currentCycle: 1,
		currentFocusPeriod: 1,
		isFocus: true,
		focusElapsedMs: 0,
		restElapsedMs: 0,
		segments,
		phaseStartedAt: null,
		endsAt: null,
		pausedRemainingMs: null,
		restActivityId: 9,
		restActivityName: 'Walk',
		...overrides,
	}
}

/** A back-to-back run of phases, each ending at its boundary. */
function contiguous(...phases: [PomodoroSegment['phase'], number][]): PomodoroSegment[] {
	let at = T0
	return phases.map(([phase, ms]) => {
		const segment: PomodoroSegment = { phase, startedAt: at, endedAt: at + ms, closedBy: 'boundary' }
		at += ms
		return segment
	})
}

describe('apportionMinutes', () => {
	it('leaves clean minutes alone', () => {
		expect(apportionMinutes([25 * MINUTE, 25 * MINUTE, 25 * MINUTE, 25 * MINUTE])).toEqual([25, 25, 25, 25])
	})

	it('makes the parts sum to the rounded total, not to the sum of rounded parts', () => {
		// 4 × 24m40s = 98m40s → 99m. Rounding each part on its own would give 4 × 25 = 100.
		const parts = apportionMinutes(Array(4).fill(24 * MINUTE + 40 * SECOND))
		expect(parts.reduce((a, b) => a + b, 0)).toBe(99)
		// Ties go to the earlier part.
		expect(parts).toEqual([25, 25, 25, 24])
	})

	it('folds a sliver into the total rather than rounding it away or up to a whole minute', () => {
		// 25m + 40s = 25m40s → 26m. The sliver carries the larger remainder, so it takes the minute.
		expect(apportionMinutes([25 * MINUTE, 40 * SECOND])).toEqual([25, 1])
		// 25m40s + 20s = 26m: the first part's 40 seconds outweigh the sliver's 20, so the minute the
		// two make together goes to the first part and the sliver has nothing left to record.
		expect(apportionMinutes([25 * MINUTE + 40 * SECOND, 20 * SECOND])).toEqual([26, 0])
	})

	it('rounds the total the way every other session is rounded — half up at 30 seconds', () => {
		expect(apportionMinutes([29 * SECOND])).toEqual([0])
		expect(apportionMinutes([30 * SECOND])).toEqual([1])
		expect(apportionMinutes([])).toEqual([])
	})
})

describe('pomodoroPhaseSpans', () => {
	it('is null for a session with no log', () => {
		expect(pomodoroPhaseSpans(session(undefined))).toBeNull()
	})

	it('merges a paused phase back into one span and starts the next after its boundary', () => {
		const spans = pomodoroPhaseSpans(
			session([
				{ phase: 'focus', startedAt: T0, endedAt: T0 + 10 * MINUTE, closedBy: 'pause' },
				{ phase: 'focus', startedAt: T0 + 12 * MINUTE, endedAt: T0 + 27 * MINUTE, closedBy: 'boundary' },
				{ phase: 'shortBreak', startedAt: T0 + 27 * MINUTE, endedAt: T0 + 29 * MINUTE, closedBy: 'stop' },
			]),
		)
		expect(spans).toEqual([
			{ phase: 'focus', startedAt: T0, endedAt: T0 + 27 * MINUTE, elapsedMs: 25 * MINUTE, completed: true },
			{
				phase: 'shortBreak',
				startedAt: T0 + 27 * MINUTE,
				endedAt: T0 + 29 * MINUTE,
				elapsedMs: 2 * MINUTE,
				completed: false,
			},
		])
	})
})

describe('planPomodoroRows', () => {
	it('dates every row at its own phase start, focus and rest against their own activities', () => {
		const rows = planPomodoroRows(
			session(contiguous(['focus', 25 * MINUTE], ['shortBreak', 5 * MINUTE], ['focus', 25 * MINUTE])),
		)
		expect(rows).toEqual([
			{ activityId: 7, phase: 'focus', startedAt: T0, minutes: 25 },
			{ activityId: 9, phase: 'shortBreak', startedAt: T0 + 25 * MINUTE, minutes: 5 },
			{ activityId: 7, phase: 'focus', startedAt: T0 + 30 * MINUTE, minutes: 25 },
		])
	})

	it('writes no rest rows when no rest activity was picked — the breaks stay gaps', () => {
		const rows = planPomodoroRows(
			session(contiguous(['focus', 25 * MINUTE], ['shortBreak', 5 * MINUTE], ['focus', 25 * MINUTE]), {
				restActivityId: null,
			}),
		)
		expect(rows!.map(row => row.phase)).toEqual(['focus', 'focus'])
	})

	it('drops a break cut short to nothing instead of sending a zero-length row', () => {
		const rows = planPomodoroRows(session(contiguous(['focus', 25 * MINUTE], ['shortBreak', 20 * SECOND])))
		expect(rows).toEqual([{ activityId: 7, phase: 'focus', startedAt: T0, minutes: 25 }])
	})

	it('keeps each activity’s rows summing to the total the save dialog quotes for it', () => {
		const focus = 24 * MINUTE + 40 * SECOND
		const rows = planPomodoroRows(
			session(
				contiguous(
					['focus', focus],
					['shortBreak', 5 * MINUTE],
					['focus', focus],
					['shortBreak', 5 * MINUTE],
					['focus', focus],
				),
			),
		)!
		const focusMinutes = rows.filter(row => row.phase === 'focus').reduce((sum, row) => sum + row.minutes, 0)
		// `sessionLengthFromMs(3 × 24m40s)` = 74m, which is what the dialog says.
		expect(focusMinutes).toBe(Math.round((3 * focus) / MINUTE))
	})

	it('is null without a log, or without a focus activity to save against', () => {
		expect(planPomodoroRows(session(undefined))).toBeNull()
		expect(planPomodoroRows(session([], { activityId: null }))).toBeNull()
	})
})
