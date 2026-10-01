import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

/**
 * The reconstruction rules in runningTimerStore, exercised against a controlled clock.
 *
 * These are the cases the store exists for and the ones that cannot be judged by looking at the
 * screen: an implementation that drifts by a few seconds, resumes a paused countdown, or invents a
 * pomodoro cycle looks perfectly fine in a browser and is silently wrong in the user's history.
 *
 * "Closing the tab" is modelled as: let the persist watcher write, kill every pending timer (the
 * tab's intervals go with it), move the wall clock forward *without* running timers, then build a
 * fresh Pinia so the store rehydrates from storage the way a new page load does.
 */

// A real localStorage rather than a mock of the user-scoped helpers, so the account namespacing is
// exercised too: with the user below, the key written is `runningTimerSession::u1`.
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	removeItem: (key: string) => {
		storage.delete(key)
	},
})

vi.mock('@/_common/modules/user/store/authStore.ts', () => ({
	useUserStore: () => ({ currentUser: { id: 1 } }),
}))
vi.mock('@/i18n.ts', () => ({ default: { global: { t: (key: string) => key } } }))
vi.mock('@/_common/utils/notifications.ts', () => ({
	showNotification: vi.fn(async () => {}),
	requestNotificationPermission: vi.fn(async () => {}),
	// `false` so `showTimerAlarmNotification` bails before it reaches the service worker: this suite
	// is about which alarms get *scheduled*, not about what the platform does when one rings.
	isNotificationSupported: () => false,
}))
vi.mock('@/_common/utils/serviceWorker.ts', () => ({
	getActiveRegistration: vi.fn(async () => undefined),
	isServiceWorkerSupported: () => false,
	registerServiceWorker: vi.fn(async () => undefined),
}))
// Mocked at the API boundary rather than deeper, so the request the store actually builds — the
// session id, the boundary instants, the phase metadata — is what gets asserted on, rather than a
// stub of the layer that builds it. It also keeps `axiosConfig` and its interceptors out of this
// suite entirely.
vi.mock('@/core/activityHistory/api/timerAlarmApi.ts', () => ({
	scheduleTimerAlarms: vi.fn(async () => 0),
	cancelTimerAlarms: vi.fn(async () => {}),
}))
vi.mock('@/core/activity/composable/useTimerNotifications.ts', () => ({
	useTimerNotifications: () => ({
		playNotificationSound: vi.fn(),
		startSoundLoop: vi.fn(),
		stopSoundLoop: vi.fn(),
		startTitleAnimation: vi.fn(),
		stopTitleAnimation: vi.fn(),
		triggerTimerEndNotification: vi.fn(),
		stopAllNotifications: vi.fn(),
		cleanup: vi.fn(),
	}),
}))

import {
	useRunningTimerStore,
	type CountdownSession,
	type PomodoroSession,
	type StopwatchSession,
} from '@/core/activityHistory/store/runningTimerStore.ts'
import { pomodoroOutcomeSummary, pomodoroPhaseSpans } from '@/core/activityHistory/store/pomodoroSessionLog.ts'
import { cancelTimerAlarms, scheduleTimerAlarms } from '@/core/activityHistory/api/timerAlarmApi.ts'
import type { ScheduleTimerAlarmsRequest } from '@/core/activityHistory/dto/request/ScheduleTimerAlarmsRequest.ts'
import { TimerBoundaryPhase } from '@/core/activityHistory/dto/enum/TimerBoundaryPhase.ts'

/** Every schedule request sent since the last reset, in call order. */
function scheduleCalls(): ScheduleTimerAlarmsRequest[] {
	return vi.mocked(scheduleTimerAlarms).mock.calls.map(([request]) => request)
}

/** The boundary instants of the most recent schedule request, as epoch ms. */
function lastScheduledAt(): number[] {
	const calls = scheduleCalls()
	const last = calls[calls.length - 1]
	return last === undefined ? [] : last.boundaries.map(boundary => Date.parse(boundary.boundaryAt))
}

/** The session ids cancelled since the last reset. */
function cancelledSessions(): string[] {
	return vi.mocked(cancelTimerAlarms).mock.calls.map(([sessionId]) => sessionId)
}

function resetAlarmCalls() {
	vi.mocked(scheduleTimerAlarms).mockClear()
	vi.mocked(cancelTimerAlarms).mockClear()
}

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const T0 = new Date('2026-08-20T09:00:00.000Z').getTime()

const UNPINNED = { pinnedActivityId: null, activityId: 7, activityName: 'Reading' }

function freshStore() {
	setActivePinia(createPinia())
	return useRunningTimerStore()
}

/** A new page load, `awayMs` after the last one closed. */
async function reload(awayMs = 0) {
	await nextTick()
	// Read the clock first: `clearAllTimers()` rewinds the fake clock to where it was installed as
	// well as dropping the pending timers, so `Date.now()` afterwards is not where we left off.
	const closedAt = Date.now()
	vi.clearAllTimers()
	vi.setSystemTime(closedAt + awayMs)
	return freshStore()
}

function startPomodoro(store: ReturnType<typeof useRunningTimerStore>) {
	return store.startPomodoro({
		...UNPINNED,
		focusMs: 25 * MINUTE,
		shortRestMs: 5 * MINUTE,
		longRestMs: 15 * MINUTE,
		focusPeriodsPerCycle: 4,
		totalCycles: 2,
		restActivityId: null,
		restActivityName: '',
	})
}

beforeEach(() => {
	storage.clear()
	resetAlarmCalls()
	vi.useFakeTimers()
	vi.setSystemTime(T0)
})

afterEach(() => {
	vi.clearAllTimers()
	vi.useRealTimers()
})

describe('a countdown across a reload', () => {
	it('comes back with the remaining time the wall clock says, to the millisecond', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })

		vi.advanceTimersByTime(4 * MINUTE)
		expect(store.remainingMs).toBe(21 * MINUTE)

		const reloaded = await reload(2 * SECOND)
		expect(reloaded.isEnded).toBe(false)
		expect(reloaded.remainingMs).toBe(21 * MINUTE - 2 * SECOND)
	})

	it('a one-minute timer reopened three minutes later is a completed one-minute session', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: MINUTE })

		const reloaded = await reload(3 * MINUTE)
		const session = reloaded.session as CountdownSession

		expect(reloaded.isEnded).toBe(true)
		// The view logs `duration - remaining`, so these two together are the whole assertion: one
		// minute is offered, not the three that passed.
		expect(reloaded.remainingMs).toBe(0)
		expect(session.durationMs).toBe(MINUTE)
	})
})

describe('a stopwatch', () => {
	it('keeps counting while nothing is mounted, and across a reload', async () => {
		const store = freshStore()
		store.startStopwatch(UNPINNED)

		vi.advanceTimersByTime(90 * SECOND)
		expect(store.stopwatchElapsedMs).toBe(90 * SECOND)

		const reloaded = await reload(2 * MINUTE)
		expect(reloaded.stopwatchElapsedMs).toBe(90 * SECOND + 2 * MINUTE)
		expect(reloaded.isEnded).toBe(false)
	})

	it('banks the elapsed time on pause and does not accrue any while paused', async () => {
		const store = freshStore()
		store.startStopwatch(UNPINNED)

		vi.advanceTimersByTime(40 * SECOND)
		store.pauseSession()

		const reloaded = await reload(HOUR)
		expect(reloaded.isPaused).toBe(true)
		expect(reloaded.stopwatchElapsedMs).toBe(40 * SECOND)
		expect((reloaded.session as StopwatchSession).runningSince).toBeNull()
	})
})

describe('a paused timer', () => {
	it('does not resume itself over a reload', async () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(10 * MINUTE)
		store.pauseSession()
		expect(store.remainingMs).toBe(15 * MINUTE)

		// An hour away. A paused session stores what is LEFT, so none of it may be spent.
		const reloaded = await reload(HOUR)
		expect(reloaded.isPaused).toBe(true)
		expect(reloaded.isEnded).toBe(false)
		expect(reloaded.remainingMs).toBe(15 * MINUTE)
	})
})

describe('a pomodoro', () => {
	it('advances its own phases while nothing is mounted', () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(25 * MINUTE)
		const session = store.session as PomodoroSession

		expect(session.isFocus).toBe(false)
		expect(session.focusElapsedMs).toBe(25 * MINUTE)
		// The period counter advances on the way back INTO focus, not out of it — that is the
		// existing machine's rule and this move must not change it.
		expect(session.currentFocusPeriod).toBe(1)
		expect(store.remainingMs).toBe(5 * MINUTE)
	})

	it('stops at the first boundary missed while away, and fabricates no cycles', async () => {
		const store = freshStore()
		startPomodoro(store)

		// Three hours would be seven phase boundaries if the cycle were replayed forward.
		const reloaded = await reload(3 * HOUR)
		const session = reloaded.session as PomodoroSession

		expect(reloaded.isEnded).toBe(true)
		// Exactly the one focus phase that was live, credited to its own end rather than to now.
		expect(session.focusElapsedMs).toBe(25 * MINUTE)
		expect(session.restElapsedMs).toBe(0)
		expect(session.currentCycle).toBe(1)
		expect(session.currentFocusPeriod).toBe(1)
		expect(session.isFocus).toBe(true)
	})

	it('credits only the elapsed part when it is stopped early', async () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(7 * MINUTE)
		store.endSession(false)

		const session = store.session as PomodoroSession
		expect(session.ended).toBe(true)
		expect(session.focusElapsedMs).toBe(7 * MINUTE)
		expect(session.restElapsedMs).toBe(0)
	})
})

/**
 * The segment log and the outcome (C5).
 *
 * The log is a breakdown of the accumulators and must never disagree with them — the assertions
 * below check both side by side, because a log that credits a second the accumulators do not is
 * fabricated time wearing a different field name.
 */
describe('a pomodoro segment log', () => {
	it('splits a paused phase into segments that still merge back into one phase', () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(10 * MINUTE)
		store.pauseSession()
		vi.advanceTimersByTime(3 * MINUTE)
		store.resumeSession()
		// The pause pushed the boundary back by its own length.
		vi.advanceTimersByTime(15 * MINUTE)

		const session = store.session as PomodoroSession
		expect(session.segments).toEqual([
			{ phase: 'focus', startedAt: T0, endedAt: T0 + 10 * MINUTE, closedBy: 'pause' },
			{ phase: 'focus', startedAt: T0 + 13 * MINUTE, endedAt: T0 + 28 * MINUTE, closedBy: 'boundary' },
		])
		// One phase, spanning the pause on the wall clock but crediting none of it.
		expect(pomodoroPhaseSpans(session)).toEqual([
			{ phase: 'focus', startedAt: T0, endedAt: T0 + 28 * MINUTE, elapsedMs: 25 * MINUTE, completed: true },
		])
		expect(session.focusElapsedMs).toBe(25 * MINUTE)
		expect(session.outcome).toBeNull()
	})

	it('closes a phase at its boundary and opens the next at that same instant', () => {
		const store = freshStore()
		startPomodoro(store)

		// Into the short break, and two minutes through it.
		vi.advanceTimersByTime(27 * MINUTE)
		const session = store.session as PomodoroSession

		expect(session.segments).toEqual([
			{ phase: 'focus', startedAt: T0, endedAt: T0 + 25 * MINUTE, closedBy: 'boundary' },
		])
		// The live break is not in the log yet: a segment is written when it is credited, not before.
		expect(session.phaseStartedAt).toBe(T0 + 25 * MINUTE)
	})

	it('records Stop mid-rest as stopped early, with the break cut where it was cut', () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(25 * MINUTE + 2 * MINUTE)
		store.endSession(false)
		const session = store.session as PomodoroSession

		expect(session.outcome).toBe('stoppedEarly')
		expect(session.segments!.at(-1)).toEqual({
			phase: 'shortBreak',
			startedAt: T0 + 25 * MINUTE,
			endedAt: T0 + 27 * MINUTE,
			closedBy: 'stop',
		})
		expect(session.restElapsedMs).toBe(2 * MINUTE)
		expect(pomodoroOutcomeSummary(session)).toEqual({
			outcome: 'stoppedEarly',
			focusPeriodsCompleted: 1,
			focusPeriodsPlanned: 8,
		})
	})

	it('does not count a focus period cut short by Stop as completed', () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(12 * MINUTE)
		store.pauseSession()
		store.endSession(false)
		const session = store.session as PomodoroSession

		// Stopped while paused: the pause already closed the segment, so Stop adds none.
		expect(session.segments).toEqual([
			{ phase: 'focus', startedAt: T0, endedAt: T0 + 12 * MINUTE, closedBy: 'pause' },
		])
		expect(pomodoroOutcomeSummary(session)).toMatchObject({ outcome: 'stoppedEarly', focusPeriodsCompleted: 0 })
	})

	it('after an absence, logs the live phase to its own end and says the app was away', async () => {
		const store = freshStore()
		startPomodoro(store)
		vi.advanceTimersByTime(26 * MINUTE)

		// Into the first break, then three hours away — well past every boundary still to come.
		const reloaded = await reload(3 * HOUR)
		const session = reloaded.session as PomodoroSession

		expect(session.outcome).toBe('ranOutWhileAway')
		expect(session.segments).toEqual([
			{ phase: 'focus', startedAt: T0, endedAt: T0 + 25 * MINUTE, closedBy: 'boundary' },
			// Credited to the break's own end, not to the moment the tab came back.
			{ phase: 'shortBreak', startedAt: T0 + 25 * MINUTE, endedAt: T0 + 30 * MINUTE, closedBy: 'boundary' },
		])
		expect(session.restElapsedMs).toBe(5 * MINUTE)
		expect(pomodoroOutcomeSummary(session)).toEqual({
			outcome: 'ranOutWhileAway',
			focusPeriodsCompleted: 1,
			focusPeriodsPlanned: 8,
		})
	})

	it('calls it completed when the boundary missed while away was the last one', async () => {
		const store = freshStore()
		store.startPomodoro({
			...UNPINNED,
			focusMs: MINUTE,
			shortRestMs: MINUTE,
			longRestMs: MINUTE,
			focusPeriodsPerCycle: 2,
			totalCycles: 1,
			restActivityId: null,
			restActivityName: '',
		})
		// Focus, break, and ten seconds into the last focus period — then the tab closes.
		vi.advanceTimersByTime(2 * MINUTE + 10 * SECOND)

		const reloaded = await reload(HOUR)
		const session = reloaded.session as PomodoroSession

		// Nothing the plan had was cut short: the last focus period ran its whole minute.
		expect(session.outcome).toBe('completed')
		expect(pomodoroOutcomeSummary(session)).toMatchObject({ focusPeriodsCompleted: 2, focusPeriodsPlanned: 2 })
	})

	it('logs every phase of a run that finishes with the app open, and calls it completed', () => {
		const store = freshStore()
		startPomodoro(store)

		vi.advanceTimersByTime(8 * (25 * MINUTE) + 6 * (5 * MINUTE) + 15 * MINUTE)
		const session = store.session as PomodoroSession

		expect(session.ended).toBe(true)
		expect(session.outcome).toBe('completed')
		const spans = pomodoroPhaseSpans(session)!
		expect(spans).toHaveLength(15)
		expect(spans.every(span => span.completed)).toBe(true)
		// Contiguous: each phase starts where the one before it ended.
		expect(spans.every((span, i) => i === 0 || span.startedAt === spans[i - 1]!.endedAt)).toBe(true)
		expect(spans.map(span => span.phase).filter(phase => phase === 'longBreak')).toHaveLength(1)
		// The log and the accumulators are the same time, broken down and summed up.
		const focusMs = spans.filter(span => span.phase === 'focus').reduce((sum, span) => sum + span.elapsedMs, 0)
		const restMs = spans.filter(span => span.phase !== 'focus').reduce((sum, span) => sum + span.elapsedMs, 0)
		expect(focusMs).toBe(session.focusElapsedMs)
		expect(restMs).toBe(session.restElapsedMs)
	})

	it('starts no log for a session stored before the log existed', async () => {
		const store = freshStore()
		startPomodoro(store)
		// The shape a session had before this field: no log, no outcome.
		const stored = store.session as PomodoroSession
		delete stored.segments
		delete stored.outcome

		const reloaded = await reload(SECOND)
		vi.advanceTimersByTime(26 * MINUTE)
		const session = reloaded.session as PomodoroSession

		// A log begun halfway through would claim the session started at its first logged phase.
		expect(session.segments).toBeUndefined()
		expect(pomodoroPhaseSpans(session)).toBeNull()
		expect(session.focusElapsedMs).toBe(25 * MINUTE)

		reloaded.endSession(false)
		expect(pomodoroOutcomeSummary(session)).toBeNull()
	})
})

describe('how a session ended', () => {
	it('a countdown that reaches zero on screen is completed', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: MINUTE })
		vi.advanceTimersByTime(MINUTE)
		expect(store.session!.outcome).toBe('completed')
	})

	it('a countdown stopped before zero is stopped early', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })
		vi.advanceTimersByTime(4 * MINUTE)
		store.endSession(false)
		expect(store.session!.outcome).toBe('stoppedEarly')
	})

	it('a countdown that ran out while the app was closed is completed, as it is logged', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: MINUTE })
		const reloaded = await reload(3 * MINUTE)
		// The whole set duration is what gets offered for logging, so the plan did run.
		expect(reloaded.session!.outcome).toBe('completed')
	})

	it('a stopwatch has no outcome, because it has no plan to complete', () => {
		const store = freshStore()
		store.startStopwatch(UNPINNED)
		vi.advanceTimersByTime(5 * MINUTE)
		store.endSession(false)
		expect(store.session!.ended).toBe(true)
		expect(store.session!.outcome).toBeNull()
	})

	it('has none while it is still running', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })
		vi.advanceTimersByTime(MINUTE)
		expect(store.session!.outcome).toBeNull()
	})
})

describe('housekeeping', () => {
	it('drops a session older than the staleness cap instead of resurrecting it', async () => {
		const store = freshStore()
		store.startStopwatch(UNPINNED)

		const reloaded = await reload(13 * HOUR)
		expect(reloaded.session).toBeNull()
	})

	it('keeps an ended session until a view has logged it', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: MINUTE })
		vi.advanceTimersByTime(MINUTE)
		expect(store.isEnded).toBe(true)

		// Closing the tab on the save dialog must not lose the finished session.
		const reloaded = await reload(10 * SECOND)
		expect(reloaded.isEnded).toBe(true)
		expect((reloaded.session as CountdownSession).durationMs).toBe(MINUTE)

		reloaded.clearSession()
		expect(reloaded.session).toBeNull()
		const afterLogging = await reload()
		expect(afterLogging.session).toBeNull()
	})
})

/**
 * The alarm that has to survive a closed tab (H11).
 *
 * The client-side alarm is a `setTimeout`, so it dies with the tab and the session ends in silence.
 * Every boundary is therefore also registered server-side, and the thing that actually goes wrong
 * here is not the registering — it is the *cancelling*: an alarm left behind by a stopped, paused,
 * discarded or already-finished session rings for a timer nobody has any more, and the user cannot
 * tell that from a bug. So most of what follows asserts on cancellation.
 */
describe('server-side alarms', () => {
	it('schedules exactly one boundary for a countdown, at the instant it lands', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })

		const [request] = scheduleCalls()
		expect(request).toBeDefined()
		expect(lastScheduledAt()).toEqual([T0 + 25 * MINUTE])
		expect(request!.activityId).toBe(7)
		expect(request!.url).toBe('/activity-history/timer')
		// A countdown has no cycle, so the server has no phase structure to word from.
		expect(request!.boundaries[0]!.phase).toBe(TimerBoundaryPhase.Plain)
		expect(request!.boundaries[0]!.phaseIndex).toBeNull()
		expect(request!.boundaries[0]!.cycleIndex).toBeNull()
		expect(cancelledSessions()).toEqual([])
	})

	it('sends the boundary as an absolute UTC instant, not a duration', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })

		// The server schedules on this verbatim. A duration would be re-derived against the server's
		// own clock and put the skew between the two straight into the alarm.
		expect(scheduleCalls()[0]!.boundaries[0]!.boundaryAt).toBe('2026-08-20T09:25:00.000Z')
	})

	it('schedules none for a stopwatch, which has no end to schedule', () => {
		const store = freshStore()
		store.startStopwatch(UNPINNED)

		expect(scheduleCalls()).toEqual([])
		expect(cancelledSessions()).toEqual([])
	})

	it('drops the schedule on pause and rebuilds it at the shifted instant on resume', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })
		const sessionId = store.session!.alarmSessionId

		vi.advanceTimersByTime(4 * MINUTE)
		resetAlarmCalls()
		store.pauseSession()
		// A paused countdown has no end instant at all, so it must have no alarm either — otherwise
		// pausing for an hour still rings at the original time.
		expect(cancelledSessions()).toEqual([sessionId])
		expect(scheduleCalls()).toEqual([])

		vi.advanceTimersByTime(30 * SECOND)
		resetAlarmCalls()
		store.resumeSession()
		expect(lastScheduledAt()).toEqual([T0 + 25 * MINUTE + 30 * SECOND])
		// Same session, so the re-post replaces rather than accumulating.
		expect(scheduleCalls()[0]!.sessionId).toBe(sessionId)
	})

	it('cancels on Stop, so nothing rings for a session the user already ended', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })
		const sessionId = store.session!.alarmSessionId

		vi.advanceTimersByTime(MINUTE)
		resetAlarmCalls()
		store.endSession(false)

		expect(cancelledSessions()).toEqual([sessionId])
		expect(scheduleCalls()).toEqual([])
	})

	it('cancels when a finished session is logged and cleared', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: MINUTE })
		const sessionId = store.session!.alarmSessionId

		vi.advanceTimersByTime(MINUTE)
		// Running out cancels it itself; clearing after that has nothing left to do.
		expect(cancelledSessions()).toEqual([sessionId])

		resetAlarmCalls()
		store.clearSession()
		expect(cancelledSessions()).toEqual([])
		await nextTick()
	})

	it('cancels the discarded session when a new one replaces it', () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })
		const discarded = store.session!.alarmSessionId

		vi.advanceTimersByTime(MINUTE)
		resetAlarmCalls()
		store.startStopwatch(UNPINNED)

		expect(cancelledSessions()).toEqual([discarded])
		// The replacement is a different session as far as the scheduler is concerned, so its own
		// set can never be confused with the discarded one's.
		expect(store.session!.alarmSessionId).not.toBe(discarded)
	})

	it('sends nothing at all when a still-running session is merely reloaded', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })

		resetAlarmCalls()
		const reloaded = await reload(2 * SECOND)

		// The boundaries did not move, so the right number of requests is zero. Without the memo of
		// what was last posted, every page load would re-post the whole set.
		expect(reloaded.isEnded).toBe(false)
		expect(scheduleCalls()).toEqual([])
		expect(cancelledSessions()).toEqual([])
	})

	it('cancels with the id the previous page load stored, for a session reconcile ends', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: MINUTE })
		const sessionId = store.session!.alarmSessionId

		resetAlarmCalls()
		const reloaded = await reload(3 * MINUTE)

		// This is the case the persisted id exists for: a page load that never registered the alarm
		// has to be able to cancel it, and the id is the only handle it has.
		expect(reloaded.isEnded).toBe(true)
		expect(cancelledSessions()).toEqual([sessionId])
		expect(sessionId).toBeTruthy()
	})

	it('cancels the alarms of a session dropped for being stale', async () => {
		const store = freshStore()
		store.startCountdown({ ...UNPINNED, durationMs: 25 * MINUTE })
		const sessionId = store.session!.alarmSessionId

		resetAlarmCalls()
		const reloaded = await reload(13 * HOUR)

		expect(reloaded.session).toBeNull()
		expect(cancelledSessions()).toEqual([sessionId])
	})

	it('schedules a pomodoro whole-cycle at Start rather than one phase at a time', () => {
		const store = freshStore()
		startPomodoro(store)

		// 4 focus periods × 2 cycles = 8 focus phases and 7 breaks between them; the final cycle's
		// long break never happens, because the session ends after its last focus period.
		const at = lastScheduledAt()
		expect(at).toHaveLength(15)
		expect(at[0]).toBe(T0 + 25 * MINUTE)
		expect(at[1]).toBe(T0 + 30 * MINUTE)
		// Three short breaks then a long one, twice over, and the run ends on the eighth focus phase.
		expect(at[at.length - 1]).toBe(T0 + 8 * (25 * MINUTE) + 6 * (5 * MINUTE) + 15 * MINUTE)
		// Strictly increasing, and every one of them still in the future.
		expect([...at].sort((a, b) => a - b)).toEqual(at)
		expect(at.every(instant => instant > T0)).toBe(true)
		// Within the API's cap, which is what `clampToContract` exists to guarantee.
		expect(at.length).toBeLessThanOrEqual(64)
	})

	it('describes each pomodoro boundary well enough for the server to word it', () => {
		const store = freshStore()
		startPomodoro(store)
		const boundaries = scheduleCalls()[0]!.boundaries

		expect(boundaries.map(boundary => boundary.phase)).toEqual([
			// Cycle 1: four focus periods, three short breaks, then the long break into cycle 2.
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.ShortBreak,
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.ShortBreak,
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.ShortBreak,
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.LongBreak,
			// Cycle 2, ending on its last focus period — no long break closes the run.
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.ShortBreak,
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.ShortBreak,
			TimerBoundaryPhase.Focus,
			TimerBoundaryPhase.ShortBreak,
			TimerBoundaryPhase.Focus,
		])

		expect(boundaries[0]).toMatchObject({ phaseIndex: 1, phaseTotal: 4, cycleIndex: 1, cycleTotal: 2 })
		// The final boundary is the whole run finishing, and the only thing saying so is that both
		// indices have reached their totals. There is no completion flag in the contract.
		expect(boundaries[boundaries.length - 1]).toMatchObject({
			phase: TimerBoundaryPhase.Focus,
			phaseIndex: 4,
			phaseTotal: 4,
			cycleIndex: 2,
			cycleTotal: 2,
		})
	})

	it('leaves a pomodoro schedule alone as its phases turn over', () => {
		const store = freshStore()
		startPomodoro(store)

		resetAlarmCalls()
		// Past the first focus boundary and into the short break.
		vi.advanceTimersByTime(26 * MINUTE)
		expect((store.session as PomodoroSession).isFocus).toBe(false)

		// The remaining boundaries were all registered at Start and none of them moved, so a phase
		// transition is not a scheduling event. Rescheduling per phase would need the live tab whose
		// absence is the entire point of this feature.
		expect(scheduleCalls()).toEqual([])
		expect(cancelledSessions()).toEqual([])
	})

	it('cancels the whole remaining cycle when a pomodoro is stopped early', () => {
		const store = freshStore()
		startPomodoro(store)
		const sessionId = store.session!.alarmSessionId

		vi.advanceTimersByTime(7 * MINUTE)
		resetAlarmCalls()
		store.endSession(false)

		// One call cancels the lot, because the whole set is keyed by the session rather than by
		// fifteen individual boundaries.
		expect(cancelledSessions()).toEqual([sessionId])
		expect(scheduleCalls()).toEqual([])
	})
})

describe('ownership', () => {
	it('lets the routed page reach any session of its kind but pins a dialog to its own task', () => {
		const store = freshStore()
		store.startCountdown({
			pinnedActivityId: 5,
			activityId: 5,
			activityName: 'Task A',
			durationMs: 25 * MINUTE,
		})

		// TrackTimeDialog opened for task 5 owns it; opened for task 9 it must not, or task A's
		// minutes would be logged against task B.
		expect(store.sessionFor('timer', 5)).not.toBeNull()
		expect(store.sessionFor('timer', 9)).toBeNull()
		expect(store.foreignSession('timer', 9)).not.toBeNull()

		// /activity-history/timer adopts it regardless, which is what makes the now bar's link work.
		expect(store.sessionFor('timer', null)).not.toBeNull()

		// A different kind is never owned, whoever asks.
		expect(store.sessionFor('stopwatch', null)).toBeNull()
		expect(store.foreignSession('stopwatch', null)).not.toBeNull()
	})
})
