import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import i18n from '@/i18n.ts'
import { niceDuration, projectBoundaries } from '@/core/activityHistory/store/timerBoundaries.ts'
import {
	clampToContract,
	dropTimerAlarms,
	newAlarmSessionId,
	pushTimerAlarms,
	showTimerAlarmNotification,
} from '@/core/activityHistory/store/timerAlarmSchedule.ts'
import { useTimerNotifications } from '@/core/activity/composable/useTimerNotifications.ts'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { readUserScoped, writeUserScoped } from '@/core/user/composable/useUserScopedStorage.ts'

/**
 * The one timing session this browser has running, and the clock that drives it.
 *
 * Before this store the three timer views held their whole state in component-local refs, so any
 * navigation, any reload and any close of TrackTimeDialog destroyed a running session and threw the
 * elapsed time away without a word. For an app whose job is getting people to start and stay on
 * tasks, that was the worst thing in the module.
 *
 * ## Two rules this file exists to enforce
 *
 * **1. State is absolute timestamps, never accumulated ticks.** `startedAtEpoch`, `runningSince`,
 * `endsAt` and `phaseStartedAt` are all `Date.now()` values and everything on screen is *derived*
 * from them against the current clock. That is the property that makes rehydration correct: a
 * session restored from storage recomputes the same numbers it would have shown had the tab never
 * closed, with no drift to accumulate. The views already worked this way; it must stay that way.
 * Interval and timeout handles are the opposite of that — they are a rendering concern, they are
 * never part of the session, and they are recreated from the timestamps whenever the store wakes up.
 *
 * **2. Never fabricate time the user did not spend.** A productivity log that invents focus minutes
 * is worse than one that is a few minutes short, so every reconstruction below rounds *against* the
 * session. See `reconcile()`.
 *
 * ## Why localStorage rather than the Pinia persist plugin's default
 *
 * The framework's `createAppPinia()` installs `pinia-plugin-persistedstate` with no options, which
 * leaves it on its own **localStorage** default (its doc comment says sessionStorage; the comment is
 * wrong, and `templateDayPlannerStore` already had to pass `storage: sessionStorage` explicitly
 * because of it). Either way this store does not use the plugin, for two reasons:
 *
 *  - **The key has to be resolved at write time, not at store-creation time.** Per-user browser
 *    state goes through `useUserScopedStorage` so two accounts on one machine do not share it. The
 *    plugin resolves `persist.key` once, when the store is created, so an account switch inside a
 *    live tab would keep writing the new user's session under the previous user's key — exactly the
 *    bleed the namespacing exists to stop. `writeUserScoped` resolves it per write.
 *  - **Restoring is not the same as loading.** A stored session has to be reconciled against the
 *    wall clock before anything reads it (see `reconcile()`), and the plugin's hydration hook runs
 *    at a point that is awkward to sequence against the rest of this setup.
 *
 * localStorage rather than sessionStorage is the deliberate half of the choice: sessionStorage dies
 * with the tab, and "I closed the tab by accident" is one of the two cases this whole file is for.
 *
 * ## Why the clock lives here and not in the views
 *
 * The store owns the tick, the phase transitions and the end-of-session alarm. If those stayed in
 * the views then navigating away from `/activity-history/pomodoro` would still silently stop the
 * pomodoro advancing and still swallow its alarm — the session would survive, but nothing would
 * happen to it. What the views keep is presentation: the activity forms, the save dialog, the
 * `done` emit, and their own idle state.
 *
 * ## The alarm, when the tab is not there
 *
 * The clock above is still entirely client-side and stays that way. What is *not* client-side is
 * the alarm: a `setTimeout` cannot fire in a tab that has been closed, so a 25-minute focus phase
 * started before the laptop lid went down used to end in silence. Every boundary is therefore also
 * registered as a one-shot server-side notification when it becomes known, and cancelled when it
 * stops being true — see `timerBoundaries.ts` for what the boundaries are and
 * `timerAlarmSchedule.ts` for how they are registered. `syncAlarms()` below is the single seam:
 * it is called after every transition and does nothing when nothing changed.
 *
 * Note what this is *not*: the session itself never goes to the server, and nothing about the
 * countdown is read back from it. The server is told one thing — "ring at this UTC instant with
 * this text" — and the reconstruction rules above stay a conversation between one device and its
 * own clock, which is the only reason they are exact.
 *
 * ## Deliberately not here
 *
 * No server sync of session state, no `beforeunload`, no cross-tab `BroadcastChannel`, no polling
 * or heartbeat. Two tabs writing the same key is last-writer-wins and is out of scope. The three
 * state machines stay three state machines; this store holds them, it does not merge them.
 */

export type TimerKind = 'stopwatch' | 'timer' | 'pomodoro'
export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak'

interface SessionBase {
	kind: TimerKind
	/** Epoch ms of the moment Start was pressed — the instant the history record is dated from. */
	startedAtEpoch: number
	/**
	 * The activity the *embedder* pinned (TrackTimeDialog passes one), or null when the user picks
	 * it inside the view's own selection form. Adoption keys on this — see `sessionFor()`.
	 */
	pinnedActivityId: number | null
	/** The activity that will actually be logged. Equal to `pinnedActivityId` on a pinned session. */
	activityId: number | null
	/** Frozen at start: the selection form is hidden while a session runs, and the save needs a name. */
	activityName: string
	paused: boolean
	/** The session is over and is waiting for a view to log it. */
	ended: boolean
	/** Whether `ended` was reached by the clock rather than by the Stop button. */
	endedAutomatically: boolean
	/**
	 * This session's identity to the alarm scheduler, minted at Start.
	 *
	 * Persisted with the session because it is the only way a later page load can *cancel* the
	 * alarms: the API is keyed by it and nothing else, so an id that goes missing leaves alarms
	 * that will fire for a session nobody has. Optional so a session stored before this field
	 * existed still hydrates; `syncAlarms` mints one on demand for those.
	 */
	alarmSessionId?: string
	/**
	 * The boundary instants last posted to the scheduler.
	 *
	 * A memo, not state the server reads back — it is here so that a page load which changes
	 * nothing sends no request. Without it every reload would re-post the whole set.
	 */
	scheduledAlarms?: number[]
}

export interface StopwatchSession extends SessionBase {
	kind: 'stopwatch'
	/** Epoch ms the current run segment started, or null while paused. */
	runningSince: number | null
	/** ms banked by previous run segments. */
	accumulatedMs: number
}

export interface CountdownSession extends SessionBase {
	kind: 'timer'
	durationMs: number
	/** Epoch ms the countdown reaches zero, or null while paused. */
	endsAt: number | null
	/** ms left when it was paused, or null while running. */
	pausedRemainingMs: number | null
}

export interface PomodoroSession extends SessionBase {
	kind: 'pomodoro'
	focusMs: number
	shortRestMs: number
	longRestMs: number
	focusPeriodsPerCycle: number
	totalCycles: number
	currentCycle: number
	currentFocusPeriod: number
	isFocus: boolean
	focusElapsedMs: number
	restElapsedMs: number
	/** Epoch ms the current phase started, or null while paused. */
	phaseStartedAt: number | null
	endsAt: number | null
	pausedRemainingMs: number | null
	restActivityId: number | null
	restActivityName: string
}

export type TimerSession = StopwatchSession | CountdownSession | PomodoroSession

type SessionOfKind<K extends TimerKind> = K extends 'stopwatch'
	? StopwatchSession
	: K extends 'timer'
		? CountdownSession
		: PomodoroSession

/** Where each kind's routed page lives, so a caller outside this module can send the user back to it. */
export const TIMER_ROUTE_NAME: Record<TimerKind, string> = {
	stopwatch: 'stopwatch',
	timer: 'timer',
	pomodoro: 'pomodoroTimer',
}

const STORAGE_NAME = 'runningTimerSession'
/** Display cadence. Sub-second so the seconds digit never visibly skips. */
const TICK_MS = 250
/**
 * A restored session older than this is dropped rather than resurrected. Nobody comes back to a
 * stopwatch they left running half a day ago, and quietly offering to log it — dated to whenever it
 * started, possibly yesterday — would be the fabrication rule 2 forbids. Longer than any real
 * session, shorter than "the next day".
 */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000

/**
 * Which phase a pomodoro is in. Derived, never stored: `isFocus` plus the period counter already
 * say it, and a stored copy is one more field that can disagree with them. Exported because the
 * view colours and titles its display from the same answer.
 */
export function pomodoroPhaseOf(session: PomodoroSession): PomodoroPhase {
	if (session.isFocus) return 'focus'
	return session.currentFocusPeriod === session.focusPeriodsPerCycle ? 'longBreak' : 'shortBreak'
}

export const useRunningTimerStore = defineStore(
	'runningTimer',
	() => {
		const t = i18n.global.t
		// Called once, for the tab's lifetime rather than a component's: the alarm has to be able to
		// fire while no timer view is mounted, which is the whole point of moving the clock in here.
		const { triggerTimerEndNotification, playNotificationSound, startTitleAnimation, stopAllNotifications } =
			useTimerNotifications()

		const session = ref<TimerSession | null>(null)
		/**
		 * The clock every derived display reads. Advanced by the ticker while a session runs, and
		 * pinned to the exact instant of a pause or a stop so a frozen display is frozen at the right
		 * number rather than at the last tick.
		 */
		const nowMs = ref(Date.now())

		let tickHandle: ReturnType<typeof setInterval> | undefined
		/**
		 * One-shot timer for the next boundary. Redundant with the tick in an awake tab, and not
		 * redundant in a hidden one: browsers throttle a 250 ms interval hard, and a single long
		 * timeout is the closest thing to an on-time alarm that a background tab still gets.
		 */
		let boundaryHandle: ReturnType<typeof setTimeout> | undefined

		// ---------------------------------------------------------------- derived state

		/**
		 * The outward-facing summary — what a surface that is not a timer view (the now bar) needs to
		 * say a session exists. A timer view asks `sessionFor()` instead, because it may only speak
		 * for the session it owns.
		 */
		const activeKind = computed<TimerKind | null>(() => session.value?.kind ?? null)
		const activityName = computed(() => session.value?.activityName ?? '')
		const isPaused = computed(() => session.value?.paused === true)
		const isEnded = computed(() => session.value?.ended === true)

		const stopwatchElapsedMs = computed(() => {
			const current = session.value
			if (current === null || current.kind !== 'stopwatch') return 0
			const live = current.runningSince === null ? 0 : Math.max(0, nowMs.value - current.runningSince)
			return current.accumulatedMs + live
		})

		/** ms left in the countdown, or in the pomodoro's current phase. Never negative. */
		const remainingMs = computed(() => {
			const current = session.value
			if (current === null || current.kind === 'stopwatch') return 0
			if (current.pausedRemainingMs !== null) return Math.max(0, current.pausedRemainingMs)
			if (current.endsAt !== null) return Math.max(0, current.endsAt - nowMs.value)
			return 0
		})

		/**
		 * What an outside surface (the now bar) should put on screen: seconds counted up for a
		 * stopwatch, seconds counted down for the other two.
		 */
		const displaySeconds = computed(() => {
			const current = session.value
			if (current === null) return 0
			return current.kind === 'stopwatch'
				? Math.floor(stopwatchElapsedMs.value / 1000)
				: Math.ceil(remainingMs.value / 1000)
		})

		// ---------------------------------------------------------------- ownership

		/**
		 * Whether a caller in `kind` embedding `pinnedActivityId` owns this session.
		 *
		 * Asymmetric on purpose. A **pinned** embedding — TrackTimeDialog, opened for one planner
		 * task — may only ever adopt the session it pinned, otherwise opening the dialog for task B
		 * while task A's timer runs would silently log A's minutes against B. An **unpinned** caller
		 * — the three routed pages — adopts any session of its kind, so that a session started
		 * inside a dialog is still reachable after the dialog is gone. That is what makes the now
		 * bar's "back to the running timer" link work for every session, not just the unpinned ones.
		 */
		function isOwnedBy(current: TimerSession, kind: TimerKind, pinnedActivityId: number | null): boolean {
			if (current.kind !== kind) return false
			return pinnedActivityId === null || current.pinnedActivityId === pinnedActivityId
		}

		/** The session this caller owns, typed to its kind, or null. */
		function sessionFor<K extends TimerKind>(kind: K, pinnedActivityId: number | null): SessionOfKind<K> | null {
			const current = session.value
			if (current === null || !isOwnedBy(current, kind, pinnedActivityId)) return null
			return current as SessionOfKind<K>
		}

		/** A session belonging to somebody else — what the "one at a time" prompt is raised about. */
		function foreignSession(kind: TimerKind, pinnedActivityId: number | null): TimerSession | null {
			const current = session.value
			if (current === null || isOwnedBy(current, kind, pinnedActivityId)) return null
			return current
		}

		// ---------------------------------------------------------------- the clock

		function stopTimers() {
			if (tickHandle !== undefined) {
				clearInterval(tickHandle)
				tickHandle = undefined
			}
			if (boundaryHandle !== undefined) {
				clearTimeout(boundaryHandle)
				boundaryHandle = undefined
			}
		}

		/** Epoch ms of the next thing that happens by itself, or null if nothing does. */
		function nextBoundary(current: TimerSession): number | null {
			if (current.kind === 'stopwatch') return null
			return current.paused ? null : current.endsAt
		}

		/**
		 * Bring the timers in line with the session. Idempotent, and the only place either handle is
		 * created — call it after anything that changes whether the session is moving.
		 */
		function syncTimers() {
			stopTimers()
			const current = session.value
			if (current === null || current.ended || current.paused) return

			nowMs.value = Date.now()
			tickHandle = setInterval(() => {
				nowMs.value = Date.now()
			}, TICK_MS)

			const boundary = nextBoundary(current)
			if (boundary !== null) {
				boundaryHandle = setTimeout(reachBoundary, Math.max(0, boundary - Date.now()))
			}
		}

		/** The countdown hit zero, or a pomodoro phase did. */
		function reachBoundary() {
			const current = session.value
			if (current === null || current.kind === 'stopwatch') return
			if (current.ended || current.paused || current.endsAt === null) return
			if (current.kind === 'timer') {
				endSession(true, current.endsAt)
			} else {
				advancePomodoro(current, current.endsAt)
			}
		}

		// ---------------------------------------------------------------- the alarm schedule

		/**
		 * Bring the server-side alarms in line with the session, whatever just happened to it.
		 *
		 * The counterpart to `syncTimers()` and called in the same places, plus the two it does not
		 * cover (`endSession`, `reconcile`). It works out what *should* be registered from the
		 * session alone rather than from the transition, which is what keeps every lifecycle path —
		 * start, pause, resume, stop, discard-and-replace, clear, and a `reconcile()` that ends a
		 * restored session — correct without each of them knowing anything about scheduling.
		 * `projectBoundaries` answers "none" for paused, ended and stopwatch sessions, so those all
		 * come out as a cancel with no special case here.
		 *
		 * Posting is a whole-set replace keyed by `alarmSessionId`, so there is nothing to reconcile
		 * and no partial state to get wrong: every call here either replaces the set or cancels it.
		 *
		 * Fire-and-forget on purpose. Nothing on screen waits for the network, and the failure mode
		 * is the behaviour that shipped before this existed.
		 */
		function syncAlarms(target: TimerSession | null = session.value) {
			if (target === null) return
			const previous = target.scheduledAlarms ?? []
			const wanted = clampToContract(projectBoundaries(target))
			// The one case that has to send nothing: a reload of a session whose boundaries have not
			// moved. Posting is a whole-set replace, so re-posting would be harmless but pointless.
			if (previous.length === wanted.length && wanted.every((boundary, i) => boundary.at === previous[i])) return

			target.scheduledAlarms = wanted.map(boundary => boundary.at)
			target.alarmSessionId ??= newAlarmSessionId()
			if (wanted.length === 0) void dropTimerAlarms(target.alarmSessionId)
			else void pushTimerAlarms(target.alarmSessionId, target.activityId, target.kind, wanted)
		}

		/** Drop every alarm belonging to a session that is going away. */
		function releaseAlarms(target: TimerSession | null) {
			if (target === null) return
			const previous = target.scheduledAlarms ?? []
			target.scheduledAlarms = []
			if (previous.length === 0 || target.alarmSessionId === undefined) return
			void dropTimerAlarms(target.alarmSessionId)
		}

		// ---------------------------------------------------------------- transitions

		/**
		 * Fold the running segment into the session's accumulators, as of `at`.
		 *
		 * `at` is passed rather than read: when a boundary fires it is the boundary's own timestamp,
		 * not `Date.now()`. A throttled background tab can deliver the callback seconds late, and
		 * crediting those seconds to the phase would be inventing focus time.
		 */
		function creditElapsed(current: TimerSession, at: number) {
			if (current.kind === 'stopwatch') {
				if (current.runningSince !== null) {
					current.accumulatedMs += Math.max(0, at - current.runningSince)
					current.runningSince = null
				}
			} else if (current.kind === 'pomodoro') {
				if (current.phaseStartedAt !== null) {
					const elapsed = Math.max(0, at - current.phaseStartedAt)
					if (current.isFocus) current.focusElapsedMs += elapsed
					else current.restElapsedMs += elapsed
					current.phaseStartedAt = null
				}
			}
		}

		function startPomodoroPhase(current: PomodoroSession, durationMs: number, from: number) {
			current.phaseStartedAt = from
			current.endsAt = from + durationMs
			current.pausedRemainingMs = null
			nowMs.value = Date.now()
			syncTimers()
			// No `syncAlarms()`: the whole cycle's boundaries were registered when Start was pressed
			// and a phase transition moves none of them. See `timerBoundaries.ts` for why the set is
			// scheduled up front rather than one phase at a time.
		}

		/**
		 * One pomodoro phase ended: bank it, say so, and move to the next one — or finish.
		 *
		 * This is the state machine PomodoroTimerView used to run in `onPhaseEnd`, moved verbatim in
		 * behaviour. It lives here so that navigating away from the pomodoro page no longer stops
		 * the cycle advancing and no longer swallows the phase alarms.
		 */
		function advancePomodoro(current: PomodoroSession, at: number) {
			creditElapsed(current, at)

			const cycleInfo = t('history.pomodoro.cycleProgress', {
				current: current.currentCycle,
				total: current.totalCycles,
			})
			const focusInfo = t('history.pomodoro.focusProgress', {
				current: current.currentFocusPeriod,
				total: current.focusPeriodsPerCycle,
			})

			void playNotificationSound()
			switch (pomodoroPhaseOf(current)) {
				case 'focus':
					startTitleAnimation(
						`${t('history.pomodoro.focusEndedTitleAnim')} · ${cycleInfo}`,
						t('history.pomodoro.timeForBreak'),
					)
					void showTimerAlarmNotification(
						t('history.pomodoro.focusPeriodEndedTitle'),
						t('history.pomodoro.focusPeriodEndedBody', {
							activity: current.activityName,
							focusInfo,
							cycleInfo,
						}),
						at,
					)
					break
				case 'shortBreak':
					startTitleAnimation(
						`${t('history.pomodoro.breakEndedTitleAnim')} · ${cycleInfo}`,
						t('history.pomodoro.timeToFocus'),
					)
					void showTimerAlarmNotification(
						t('history.pomodoro.shortBreakEndedTitle'),
						t('history.pomodoro.shortBreakEndedBody', {
							cycleInfo,
							activity: current.activityName,
						}),
						at,
					)
					break
				case 'longBreak':
					startTitleAnimation(
						t('history.pomodoro.longBreakEndedTitleAnim'),
						t('history.pomodoro.startingCycle', { n: current.currentCycle + 1 }),
					)
					void showTimerAlarmNotification(
						t('history.pomodoro.longBreakEndedTitle'),
						t('history.pomodoro.longBreakEndedBody', {
							current: current.currentCycle,
							next: current.currentCycle + 1,
						}),
						at,
					)
					break
			}

			const wasEndOfCycle = current.currentFocusPeriod === current.focusPeriodsPerCycle
			current.isFocus = !current.isFocus

			if (current.currentCycle === current.totalCycles && wasEndOfCycle && !current.isFocus) {
				endSession(true, at)
				return
			}

			let nextDuration: number
			if (current.isFocus) {
				nextDuration = current.focusMs
				current.currentFocusPeriod = wasEndOfCycle ? 1 : current.currentFocusPeriod + 1
			} else if (wasEndOfCycle) {
				nextDuration = current.longRestMs
				current.currentCycle++
			} else {
				nextDuration = current.shortRestMs
			}
			startPomodoroPhase(current, nextDuration, at)
		}

		/**
		 * The alarm and the system notification for a session that ran itself out.
		 *
		 * `at` is the boundary instant this end belongs to, and it is only used to tag the
		 * notification: the scheduled push for the same instant carries the same tag and therefore
		 * replaces this one instead of stacking on top of it. See `alarmTag`.
		 */
		function announceEnd(current: TimerSession, at: number) {
			if (current.kind === 'timer') {
				triggerTimerEndNotification(t('history.timer.endedTitleAnim'), current.activityName)
				void showTimerAlarmNotification(
					t('history.timer.endedNotifTitle'),
					t('history.timer.endedNotifBody', {
						activity: current.activityName,
						duration: niceDuration(current.durationMs),
					}),
					at,
				)
				return
			}
			if (current.kind !== 'pomodoro') return

			const completedCycles = current.currentCycle
			const cycleCount = t('history.pomodoro.completeCycleCount', { count: completedCycles }, completedCycles)
			const focusDuration = niceDuration(current.focusElapsedMs)
			triggerTimerEndNotification(
				t('history.pomodoro.completeTitleAnim', { cycleCount }),
				t('history.pomodoro.completeSubtitle', {
					activity: current.activityName,
					duration: focusDuration,
				}),
			)
			void showTimerAlarmNotification(
				t('history.pomodoro.completeNotifTitle'),
				t(
					'history.pomodoro.doneSummary',
					{ count: completedCycles, activity: current.activityName, duration: focusDuration },
					completedCycles,
				) +
					(current.restActivityName
						? t('history.pomodoro.restedWith', { activity: current.restActivityName })
						: '') +
					t('history.pomodoro.forDuration', { duration: niceDuration(current.restElapsedMs) }),
				at,
			)
		}

		// ---------------------------------------------------------------- commands

		function pauseSession() {
			const current = session.value
			if (current === null || current.ended || current.paused) return
			const at = Date.now()
			creditElapsed(current, at)
			if (current.kind !== 'stopwatch' && current.endsAt !== null) {
				// A paused countdown stores what is LEFT, not an end instant. Storing an end instant
				// would mean a reload while paused silently resumed the countdown.
				current.pausedRemainingMs = Math.max(0, current.endsAt - at)
				current.endsAt = null
			}
			current.paused = true
			nowMs.value = at
			syncTimers()
			// A paused session has no end instant, so it has no schedule either: this cancels the lot
			// and `resumeSession` registers a fresh set at the shifted instants.
			syncAlarms()
		}

		function resumeSession() {
			const current = session.value
			if (current === null || current.ended || !current.paused) return
			const at = Date.now()
			if (current.kind === 'stopwatch') {
				current.runningSince = at
			} else {
				current.endsAt = at + (current.pausedRemainingMs ?? 0)
				current.pausedRemainingMs = null
				if (current.kind === 'pomodoro') current.phaseStartedAt = at
			}
			current.paused = false
			nowMs.value = at
			syncTimers()
			syncAlarms()
		}

		/**
		 * Finish the session and leave it in place for a view to log.
		 *
		 * It is deliberately NOT cleared here: whoever adopts it owns the "save to history or emit
		 * `done`" step, and that step depends on how the session was embedded. `clearSession()` is
		 * the counterpart, called once that has happened.
		 */
		function endSession(automatic: boolean, at: number = Date.now()) {
			const current = session.value
			if (current === null || current.ended) return
			if (!current.paused) creditElapsed(current, at)
			current.ended = true
			current.endedAutomatically = automatic
			// Pin the clock to the ending instant so a display frozen by the stopped ticker is frozen
			// on the right number rather than up to one tick short of it.
			nowMs.value = at
			stopTimers()
			// Before the announce: a Stop pressed a second before the boundary must not leave a push
			// behind that rings for a session that is already over.
			syncAlarms()
			if (automatic) announceEnd(current, at)
		}

		function clearSession() {
			releaseAlarms(session.value)
			session.value = null
			stopTimers()
			stopAllNotifications()
		}

		interface StartCommon {
			pinnedActivityId: number | null
			activityId: number | null
			activityName: string
		}

		function baseSession(kind: TimerKind, init: StartCommon, at: number): SessionBase {
			return {
				kind,
				startedAtEpoch: at,
				pinnedActivityId: init.pinnedActivityId,
				activityId: init.activityId,
				activityName: init.activityName,
				paused: false,
				ended: false,
				endedAutomatically: false,
				// Minted here rather than at the first schedule: it identifies the *session*, and a
				// session that starts, registers alarms, and has the tab killed before the response
				// lands still has to be cancellable by the next page load.
				alarmSessionId: newAlarmSessionId(),
			}
		}

		// Every `start*` first releases whatever it is replacing. A start is allowed to discard a
		// running session (the views confirm that with the user first — see `useTimerSessionGuard`),
		// and the discarded session's alarms have to go with it or they ring for a timer nobody has.
		function startStopwatch(init: StartCommon): StopwatchSession {
			releaseAlarms(session.value)
			const at = Date.now()
			const created: StopwatchSession = {
				...baseSession('stopwatch', init, at),
				kind: 'stopwatch',
				runningSince: at,
				accumulatedMs: 0,
			}
			session.value = created
			syncTimers()
			syncAlarms()
			return created
		}

		function startCountdown(init: StartCommon & { durationMs: number }): CountdownSession {
			releaseAlarms(session.value)
			const at = Date.now()
			const created: CountdownSession = {
				...baseSession('timer', init, at),
				kind: 'timer',
				durationMs: init.durationMs,
				endsAt: at + init.durationMs,
				pausedRemainingMs: null,
			}
			session.value = created
			syncTimers()
			syncAlarms()
			return created
		}

		function startPomodoro(
			init: StartCommon & {
				focusMs: number
				shortRestMs: number
				longRestMs: number
				focusPeriodsPerCycle: number
				totalCycles: number
				restActivityId: number | null
				restActivityName: string
			},
		): PomodoroSession {
			releaseAlarms(session.value)
			const at = Date.now()
			const created: PomodoroSession = {
				...baseSession('pomodoro', init, at),
				kind: 'pomodoro',
				focusMs: init.focusMs,
				shortRestMs: init.shortRestMs,
				longRestMs: init.longRestMs,
				focusPeriodsPerCycle: init.focusPeriodsPerCycle,
				totalCycles: init.totalCycles,
				currentCycle: 1,
				currentFocusPeriod: 1,
				isFocus: true,
				focusElapsedMs: 0,
				restElapsedMs: 0,
				phaseStartedAt: at,
				endsAt: at + init.focusMs,
				pausedRemainingMs: null,
				restActivityId: init.restActivityId,
				restActivityName: init.restActivityName,
			}
			session.value = created
			syncTimers()
			syncAlarms()
			return created
		}

		// ---------------------------------------------------------------- persistence

		/**
		 * Bring a session restored from storage back in line with the wall clock.
		 *
		 * Three cases, and the last one is the one worth reading:
		 *
		 *  - **Paused.** Nothing to do. It stores remaining duration, not an end instant, precisely
		 *    so that time away does not run it down.
		 *  - **A countdown whose `endsAt` has passed.** It finished while the app was gone. It lands
		 *    ended, so the view offers the *set* duration to log — a 1-minute timer reopened three
		 *    minutes later is a completed 1-minute session, not a 3-minute one. No alarm is raised:
		 *    the moment it belonged to is over, and a siren on page load helps nobody.
		 *  - **A pomodoro that crossed a phase boundary.** It stops at the *first* missed boundary
		 *    and presents itself as a completed session. It does not replay the cycle forward. It
		 *    could — the durations are all here — but every phase it replayed would be an assertion
		 *    that the user was sitting there focusing through an absence long enough to close the
		 *    tab, and fabricated focus minutes in a productivity log are worse than a short session
		 *    (rule 2). The phase that was live is credited up to its own end, never up to now.
		 *
		 * A session older than `STALE_AFTER_MS` is dropped outright rather than reconciled.
		 */
		function reconcile(at: number = Date.now()) {
			const current = session.value
			if (current === null) return

			if (at - current.startedAtEpoch > STALE_AFTER_MS) {
				releaseAlarms(current)
				session.value = null
				return
			}
			// A stopwatch has no boundary to overshoot: elapsed is derived from `runningSince`, so it
			// simply reads the wall time it has been running, which is what a stopwatch measures.
			if (current.ended || current.paused || current.kind === 'stopwatch') return
			if (current.endsAt === null || current.endsAt > at) return

			if (current.kind === 'pomodoro') {
				creditElapsed(current, current.endsAt)
			}
			current.ended = true
			current.endedAutomatically = true
			nowMs.value = current.endsAt
		}

		function readStored(): TimerSession | null {
			const raw = readUserScoped(STORAGE_NAME)
			if (!raw) return null
			try {
				return JSON.parse(raw) as TimerSession | null
			} catch {
				return null
			}
		}

		function hydrate() {
			stopTimers()
			session.value = readStored()
			reconcile()
			syncTimers()
			// Ordinarily a no-op: a session that is still running comes back with the same boundaries
			// it was registered against, so `syncAlarms` sends nothing. It earns its place on the
			// other path — a session `reconcile()` has just *ended* projects no boundaries, so the
			// alarm that would have fired for it later is cancelled here, by a page load that never
			// registered it and knows it only by the id stored with the session.
			syncAlarms()
		}

		// `deep`, because everything after `start*` is a field mutation on the one session object.
		// `null` is written rather than removed so the key's shape stays uniform for the reader.
		// Registered before the first `hydrate()` so that whatever `reconcile()` decides about a
		// restored session is written back rather than waiting for the next mutation.
		watch(session, current => writeUserScoped(STORAGE_NAME, JSON.stringify(current)), { deep: true })

		hydrate()

		// Covers a sign-in as much as a sign-out. A Pinia store is a singleton for the tab, and the
		// storage key is per account, so without this a second account in the same tab would keep
		// looking at — and eventually overwrite — the first one's session.
		watch(
			() => useUserStore().currentUser.id,
			() => hydrate(),
		)

		return {
			session,
			isPaused,
			isEnded,
			activeKind,
			activityName,
			stopwatchElapsedMs,
			remainingMs,
			displaySeconds,
			sessionFor,
			foreignSession,
			startStopwatch,
			startCountdown,
			startPomodoro,
			pauseSession,
			resumeSession,
			endSession,
			clearSession,
		}
	},
	// Hand-rolled above: the key must be resolved per write, and a restored session needs
	// reconciling before anything reads it. See the header comment.
	{ persist: false },
)
