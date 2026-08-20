import type { Time } from '@/_common/dto/dto/Time.ts'

/**
 * The date+time scope every activity-tracking dashboard request carries.
 *
 * Replaces `_common`'s `DateAndTimeRangeRequest` for this module: that DTO's `date` is a single day,
 * which is the ceiling U3 removes. It is a module-local base rather than a framework change because
 * `dateFrom`/`dateTo` + a *repeating daily* time window is this module's semantic, not a generic one.
 *
 * `from`/`to` remain a TIME-OF-DAY window applied to EACH day in `[dateFrom, dateTo]` — they are not
 * the endpoints of the range. The past-midnight rule is unchanged: when `to <= from` the window ends
 * on the following calendar day, so 07:00-00:00 over three days is three 17-hour windows, not one
 * 65-hour block. See `prompts/activity-tracking/backend/U3-backend.md`.
 */
export class ActivityRangeRequest {
	constructor(
		public readonly dateFrom: string,
		public readonly dateTo: string,
		public readonly from: Time,
		public readonly to: Time,
	) {}
}
