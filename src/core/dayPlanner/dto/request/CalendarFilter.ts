import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

export class CalendarFilter {
	constructor(
		public from: Date,
		public until: Date,
	) {}

	// Both bounds are `DateOnly` on the server, so they go out as calendar days — see
	// `PlannerTaskRequest.toJSON` for what a raw `Date` turns into on a UTC host.
	toJSON() {
		return { from: formatDateForApi(this.from), until: formatDateForApi(this.until) }
	}
}
