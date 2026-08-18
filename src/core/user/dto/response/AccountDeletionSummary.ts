// Read outside a transaction on the server — a warning, not a receipt. Do not reconcile an
// erasure against these numbers. See `prompts/user/backend/B6-account-summary.md`.
export class AccountDeletionSummary {
	constructor(
		public activityCount: number = 0,
		public trackedSessionCount: number = 0,
		public trackedFrom: string | null = null,
		public trackedTo: string | null = null,
		public trackedTimeSpanDays: number = 0,
		public automaticTrackingEntryCount: number = 0,
		public dayPlanCount: number = 0,
		public plannerTaskCount: number = 0,
		public dayTemplateCount: number = 0,
		public todoListCount: number = 0,
		public todoItemCount: number = 0,
		public routineCount: number = 0,
		public leisureItemCount: number = 0,
		public memoryAnchorCount: number = 0,
		public googleCalendarLinked: boolean = false,
	) {}

	static fromJson(object: any) {
		const {
			activityCount = 0,
			trackedSessionCount = 0,
			trackedFrom = null,
			trackedTo = null,
			trackedTimeSpanDays = 0,
			automaticTrackingEntryCount = 0,
			dayPlanCount = 0,
			plannerTaskCount = 0,
			dayTemplateCount = 0,
			todoListCount = 0,
			todoItemCount = 0,
			routineCount = 0,
			leisureItemCount = 0,
			memoryAnchorCount = 0,
			googleCalendarLinked = false,
		} = object
		return new AccountDeletionSummary(
			activityCount,
			trackedSessionCount,
			trackedFrom,
			trackedTo,
			trackedTimeSpanDays,
			automaticTrackingEntryCount,
			dayPlanCount,
			plannerTaskCount,
			dayTemplateCount,
			todoListCount,
			todoItemCount,
			routineCount,
			leisureItemCount,
			memoryAnchorCount,
			googleCalendarLinked,
		)
	}
}
