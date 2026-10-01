import { describe, expect, it } from 'vitest'
import { Time } from '@/_common/dto/dto/Time.ts'
import { countdownSessionRequest, pomodoroSessionRequest } from '@/core/activityHistory/store/timerSessionRequest.ts'
import { MAX_SESSION_RECORDS } from '@/core/activityHistory/store/pomodoroSessionLog.ts'
import type {
	CountdownSession,
	PomodoroSegment,
	PomodoroSession,
} from '@/core/activityHistory/store/runningTimerStore.ts'

const SECOND = 1_000
const MINUTE = 60 * SECOND
const T0 = Date.parse('2026-09-29T08:00:00.000Z')

const base = {
	startedAtEpoch: T0,
	pinnedActivityId: null,
	activityId: 7,
	activityName: 'Reading',
	paused: false,
	ended: true,
}

function pomodoro(segments: PomodoroSegment[] | undefined, overrides: Partial<PomodoroSession> = {}): PomodoroSession {
	return {
		...base,
		kind: 'pomodoro',
		outcome: 'stoppedEarly',
		focusMs: MINUTE,
		shortRestMs: MINUTE,
		longRestMs: MINUTE,
		focusPeriodsPerCycle: 2,
		totalCycles: 1,
		currentCycle: 1,
		currentFocusPeriod: 2,
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

/** Alternating focus / short break, each a clean minute, all ending at their boundary. */
function alternating(phaseCount: number): PomodoroSegment[] {
	return Array.from({ length: phaseCount }, (_, i) => ({
		phase: i % 2 === 0 ? ('focus' as const) : ('shortBreak' as const),
		startedAt: T0 + i * MINUTE,
		endedAt: T0 + (i + 1) * MINUTE,
		closedBy: 'boundary' as const,
	}))
}

/** What actually goes over the wire. */
function wire(value: unknown) {
	return JSON.parse(JSON.stringify(value))
}

describe('pomodoroSessionRequest', () => {
	it('sends the B3 body: PascalCase enums, both counts, one record per phase in start order', () => {
		const request = pomodoroSessionRequest(
			pomodoro([
				...alternating(2),
				{
					phase: 'focus',
					startedAt: T0 + 2 * MINUTE,
					endedAt: T0 + 2 * MINUTE + 10 * SECOND,
					closedBy: 'stop',
				},
			]),
		)

		expect(wire(request)).toEqual({
			kind: 'Pomodoro',
			outcome: 'StoppedEarly',
			plannedFocusPeriods: 2,
			completedFocusPeriods: 1,
			records: [
				// The 10-second sliver of the second focus period rounds to nothing and is not sent.
				{
					activityId: 7,
					startTimestamp: '2026-09-29T08:00:00.000Z',
					length: { hours: 0, minutes: 1 },
					phase: 'Focus',
				},
				{
					activityId: 9,
					startTimestamp: '2026-09-29T08:01:00.000Z',
					length: { hours: 0, minutes: 1 },
					phase: 'ShortBreak',
				},
			],
		})
	})

	it('drops the break rows rather than exceed the per-session cap', () => {
		// 36 focus periods and 35 breaks — the setup panel's own 6 × 6 maximum, with a rest activity.
		const request = pomodoroSessionRequest(pomodoro(alternating(71), { outcome: 'completed' }))!
		expect(request.records).toHaveLength(36)
		expect(request.records.every(record => record.phase === 'Focus')).toBe(true)
	})

	it('gives up on a session with more focus periods than one request may carry', () => {
		const focusOnly = alternating(2 * (MAX_SESSION_RECORDS + 1)).filter(segment => segment.phase === 'focus')
		expect(pomodoroSessionRequest(pomodoro(focusOnly, { restActivityId: null }))).toBeNull()
	})

	it('gives up on a session with no log or no outcome, which the caller saves the old way', () => {
		expect(pomodoroSessionRequest(pomodoro(undefined))).toBeNull()
		expect(pomodoroSessionRequest(pomodoro(alternating(1), { outcome: undefined }))).toBeNull()
	})

	it('sends each start as a UTC instant with a trailing Z, which the API requires', () => {
		const request = pomodoroSessionRequest(pomodoro(alternating(3)))
		expect(wire(request).records.every((r: { startTimestamp: string }) => r.startTimestamp.endsWith('Z'))).toBe(
			true,
		)
	})
})

describe('countdownSessionRequest', () => {
	function countdown(overrides: Partial<CountdownSession> = {}): CountdownSession {
		return {
			...base,
			kind: 'timer',
			outcome: 'completed',
			durationMs: 25 * MINUTE,
			endsAt: null,
			pausedRemainingMs: 0,
			...overrides,
		}
	}

	it('is one record with no phase and no counts, carrying the length the dialog quoted', () => {
		const request = countdownSessionRequest(countdown(), new Date(T0), Time.fromMinutes(25))
		expect(wire(request)).toEqual({
			kind: 'Timer',
			outcome: 'Completed',
			plannedFocusPeriods: null,
			completedFocusPeriods: null,
			records: [
				{
					activityId: 7,
					startTimestamp: '2026-09-29T08:00:00.000Z',
					length: { hours: 0, minutes: 25 },
					phase: null,
				},
			],
		})
	})

	it('gives up without an outcome or an activity', () => {
		expect(countdownSessionRequest(countdown({ outcome: undefined }), new Date(T0), Time.fromMinutes(5))).toBeNull()
		expect(countdownSessionRequest(countdown({ activityId: null }), new Date(T0), Time.fromMinutes(5))).toBeNull()
	})
})
