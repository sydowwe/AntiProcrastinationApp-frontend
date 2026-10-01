import type { Time } from '@/_common/dto/dto/Time.ts'

/**
 * One row of a timer session: a pomodoro phase at its real start, or a countdown's single run.
 * Every rule of a single `POST /activity-history` row applies to it, B17's positive length included.
 */
export class ActivityHistorySessionRecordRequest {
	constructor(
		public activityId: number,
		/** Serialized as ISO 8601 with a trailing `Z` — the API refuses an instant without an offset. */
		public startTimestamp: Date,
		public length: Time,
		/** The API's member name (`Focus`, `ShortBreak`, `LongBreak`); null on a countdown's record. */
		public phase: string | null,
	) {}
}

/**
 * `POST /activity-history/session` — a finished pomodoro or countdown, written all-or-nothing.
 *
 * The enum fields carry the API's PascalCase member names rather than the client enums' values; see
 * `timerSessionRequest.ts`, which is the only place this is built.
 */
export class ActivityHistorySessionRequest {
	constructor(
		public kind: string,
		public outcome: string,
		/** Both non-null for a pomodoro, both null for a countdown. */
		public plannedFocusPeriods: number | null,
		public completedFocusPeriods: number | null,
		/** In strictly increasing start order: 1 to `MAX_SESSION_RECORDS`, exactly one for a countdown. */
		public records: ActivityHistorySessionRecordRequest[],
	) {}
}
