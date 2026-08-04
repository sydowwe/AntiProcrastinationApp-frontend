/**
 * Defer the caller's delivery of a single upcoming occurrence to a later instant. Per recipient, per
 * occurrence and append-only — re-snoozing is allowed and simply records a new, later deferral.
 */
export class SnoozeOccurrenceRequest {
	constructor(
		public reminderId: number,
		// The occurrence instant to defer. Must be in the future.
		public occurrenceInstant: Date,
		// When to deliver it instead. Must be in the future.
		public snoozeUntil: Date,
	) {}
}
