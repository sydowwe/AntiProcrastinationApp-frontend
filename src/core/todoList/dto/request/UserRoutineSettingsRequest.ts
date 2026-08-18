export class UserRoutineSettingsRequest {
	/** `null` clears the dismissal, so the review card comes back. */
	constructor(public routineReviewDismissedForWeekStart: string | null = null) {}

	static fromJson(json: any): UserRoutineSettingsRequest {
		return new UserRoutineSettingsRequest(json?.routineReviewDismissedForWeekStart ?? null)
	}
}
