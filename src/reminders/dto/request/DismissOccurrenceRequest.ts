/**
 * Dismiss the caller's delivery of a single upcoming occurrence. Per recipient, per occurrence and
 * append-only — it never affects other recipients, the reminder's schedule, or past records.
 */
export class DismissOccurrenceRequest {
	constructor(
		public reminderId: number,
		// The occurrence instant to act on. Must be in the future.
		public occurrenceInstant: Date,
	) {}
}
