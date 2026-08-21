import type { TimerBoundaryPhase } from '@/core/activityHistory/dto/enum/TimerBoundaryPhase.ts'

/**
 * One boundary of a running timer, as the alarm scheduler wants it.
 *
 * `boundaryAt` is an absolute UTC instant and nothing else. It was computed on this device from
 * `Date.now()`, and the server schedules on it verbatim rather than re-deriving it from a duration
 * against its own clock — which is the whole reason the alarm lands on the second the user is
 * watching for rather than on the second the server thinks it is.
 *
 * The index fields describe *where in the cycle* the boundary sits, and the server composes the
 * notification text from them. They are all null for a `Plain` countdown, which has no cycle.
 */
export class TimerAlarmBoundaryRequest {
	constructor(
		/** ISO 8601, UTC. */
		public boundaryAt: string,
		public phase: TimerBoundaryPhase,
		/** 1-based focus period within the cycle. */
		public phaseIndex: number | null = null,
		public phaseTotal: number | null = null,
		/** 1-based cycle within the run. */
		public cycleIndex: number | null = null,
		public cycleTotal: number | null = null,
	) {}
}

/**
 * The whole set of alarms for one timing session.
 *
 * ## Why the client posts a timer-domain fact rather than a reminder definition
 *
 * The first cut of this aimed at the framework's `reminder-definition` routes, on the strength of
 * `ReminderScheduleType.OneShot` describing exactly this case. That was wrong twice over, and the
 * backend answered both: the register route is Admin/Root ad-hoc ops surface that a normal user may
 * not call, and the reminders module has no per-reminder trigger anyway — everything fires from one
 * sweep whose default five-minute cadence its own docs call the firing-precision floor. Fine for
 * "probation ends in 30 days", useless for a pomodoro. These alarms sit on a real one-shot trigger
 * on the exact instant instead.
 *
 * So the client states a fact about its own domain — "this session has boundaries at these instants"
 * — and the backend decides what to schedule from it.
 *
 * ## Replace-by-session, which is what makes every caller simple
 *
 * Posting is **idempotent on `sessionId`**: a post replaces the session's whole set. There is no
 * partial update, no per-boundary key, and nothing to reconcile — which is why a tab that is unsure
 * what landed before it reloaded can simply re-post. Boundaries already in the past are dropped
 * rather than fired, and rather than failing the request, precisely so that a set re-sent after a
 * slow reload does not lose the boundaries still to come.
 *
 * ## Not to be mistaken for session sync
 *
 * Nothing here is session *state*. The server is told when to push a notification and never reads
 * these rows back to reconstruct anything; there is no status endpoint and there should not be one.
 * The countdown stays client-side and the server is never authoritative for `endsAt`.
 */
export class ScheduleTimerAlarmsRequest {
	constructor(
		/** Client-generated uuid, persisted with the session. See `newAlarmSessionId`. */
		public sessionId: string,
		public boundaries: TimerAlarmBoundaryRequest[],
		/** Null when the timer names no activity. */
		public activityId: number | null = null,
		/** A relative route beginning with a single `/`; where `notificationclick` lands. */
		public url: string | null = null,
	) {}
}
