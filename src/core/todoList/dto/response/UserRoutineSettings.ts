export class UserRoutineSettings {
	constructor(public routineReviewDismissedForWeekStart: string | null) {}

	static fromJson(json: any): UserRoutineSettings {
		return new UserRoutineSettings(normalizeToIsoDate(json?.routineReviewDismissedForWeekStart))
	}
}

/**
 * The endpoint accepts (and may therefore echo) either a plain `2026-08-17` or a full instant such
 * as `2026-08-17T00:00:00.000Z`, because a value round-tripped through a JS `Date` arrives as the
 * latter. The week comparison is a string equality against `formatDateForApi`, so trim anything
 * longer back to the calendar date rather than making every caller do it.
 */
function normalizeToIsoDate(value: unknown): string | null {
	if (typeof value !== 'string' || value.length === 0) return null
	return value.slice(0, 10)
}
