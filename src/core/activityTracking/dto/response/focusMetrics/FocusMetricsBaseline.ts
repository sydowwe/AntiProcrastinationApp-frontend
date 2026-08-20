/**
 * The same four measures over the user's chosen lookback, for comparison against their own recent
 * self. Every field is independently nullable — the server sends what it has enough history for.
 *
 * There is no `percentChange` here and there must not be one: these are rendered as a bare secondary
 * figure ("87 · typically 61"), never as a signed percentage, an arrow or a colour.
 *
 * WHAT SCALE EACH FIELD IS ON — the trap when the span is longer than a day:
 * - `switchCount` is the lookback's mean day SCALED BY the span's day count, so it is directly
 *   comparable to the span's own `switchCount`.
 * - `longestBlockSeconds` / `longestGapSeconds` are per-day MEANS, unscaled. Over a multi-day span
 *   they are NOT comparable to the span figures shown beside them, which are single maxima over the
 *   whole span. Compare per-day or omit — never print one next to the other as the same quantity.
 * - `medianSessionSeconds` is the pooled median over the lookback, which is scale-free and therefore
 *   always comparable.
 */
export class FocusMetricsBaseline {
	constructor(
		public switchCount: number | null,
		public medianSessionSeconds: number | null,
		public longestBlockSeconds: number | null,
		public longestGapSeconds: number | null,
	) {}

	static fromJson(json: any): FocusMetricsBaseline {
		const {
			switchCount = null,
			medianSessionSeconds = null,
			longestBlockSeconds = null,
			longestGapSeconds = null,
		} = json ?? {}
		return new FocusMetricsBaseline(switchCount, medianSessionSeconds, longestBlockSeconds, longestGapSeconds)
	}
}
