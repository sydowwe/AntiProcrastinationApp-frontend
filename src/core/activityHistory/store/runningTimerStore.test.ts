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
