/**
 * Why one day of a calendar batch (template apply, day copy, day-type change) failed — the server's
 * `CalendarBatchFailureReason`. Only `BatchOperationResult.failureReason` carries it.
 */
export enum CalendarBatchFailureReason {
	/** No day the user owns has that id: stale, deleted, or another account's. */
	NotFound = 'notFound',
	/** The day type is impossible on that weekday (Workday on a weekend, Weekend on a weekday). */
	DayTypeNotAllowed = 'dayTypeNotAllowed',
	/** The day's write threw and was rolled back. Also the fallback when an older API sends no reason. */
	Error = 'error',
}
