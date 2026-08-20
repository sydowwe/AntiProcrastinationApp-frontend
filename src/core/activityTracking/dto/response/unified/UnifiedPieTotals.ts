/**
 * Span totals after the overlap rule — `totalSeconds` is wall-clock counted once, not the sum of the
 * three dashboards.
 *
 * The count fields are DISTINCT counts over the whole span, the same requirement `U3-backend.md` §4
 * put on the per-source totals: an app used on all seven days of a week counts once. Getting that
 * wrong is invisible on a single day and inflates sevenfold on a week.
 */
export class UnifiedPieTotals {
	constructor(
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		/** Distinct `label`s over the span. */
		public totalItems: number,
		/** Distinct sessions after de-overlapping — a session split by the rule counts once. */
		public totalSessions: number,
	) {}

	static fromJson(json: any): UnifiedPieTotals {
		const {
			totalSeconds = 0,
			activeSeconds = 0,
			backgroundSeconds = 0,
			totalItems = 0,
			totalSessions = 0,
		} = json ?? {}
		return new UnifiedPieTotals(totalSeconds, activeSeconds, backgroundSeconds, totalItems, totalSessions)
	}
}
