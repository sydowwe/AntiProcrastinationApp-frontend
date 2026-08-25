import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

/**
 * Range for `POST planner-task/plan-vs-actual-trend`. Both ends inclusive.
 *
 * `YYYY-MM-DD` strings rather than `Date`, unlike `CalendarFilter`: the contract names that format,
 * and it is the local calendar date the user is looking at. Serializing a `Date` would send an
 * instant in UTC, which shifts the range by a day for anyone east or west of it.
 *
 * The server rejects `until` before `from`, and any range over 366 days, with a 400.
 */
export class PlanVsActualTrendFilter {
	constructor(
		public from: string,
		public until: string,
	) {}

	static fromDates(from: Date, until: Date): PlanVsActualTrendFilter {
		return new PlanVsActualTrendFilter(formatDateForApi(from), formatDateForApi(until))
	}
}
