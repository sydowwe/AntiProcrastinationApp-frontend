import { FocusBlock } from '@/core/activityTracking/dto/response/focusMetrics/FocusBlock.ts'
import { FocusMetricsBaseline } from '@/core/activityTracking/dto/response/focusMetrics/FocusMetricsBaseline.ts'

/**
 * The shape of a span's attention, as opposed to its volume. Every field is descriptive — none of
 * them is a score and nothing here ranks one day against another.
 *
 * Computed server-side over the primary lane only, per day-window: a block cannot span the night
 * between two days of a range, and the hours the user excluded are never a gap candidate. See
 * `prompts/activity-tracking/backend/U5-backend.md` §4 for the full definitions.
 *
 * `daysWithActivity` counts days in the span that had at least one session, not days in the span —
 * days the user was away must not dilute a per-day figure.
 */
export class FocusMetricsResponse {
	constructor(
		public sessionCount: number,
		public daysWithActivity: number,
		public switchCount: number,
		/** May be fractional: an even-count median is the mean of the two middle values. */
		public medianSessionSeconds: number,
		/** `null` when there is no interior gap — a span with fewer than two sessions has none. */
		public longestGapSeconds: number | null,
		/** `null` on an empty span. */
		public longestBlock: FocusBlock | null,
		/** `null` when no baseline was requested, or when there is not enough history for one. */
		public baseline: FocusMetricsBaseline | null,
	) {}

	static fromJson(json: any): FocusMetricsResponse {
		const {
			sessionCount = 0,
			daysWithActivity = 0,
			switchCount = 0,
			medianSessionSeconds = 0,
			longestGapSeconds = null,
			longestBlock = null,
			baseline = null,
		} = json ?? {}
		return new FocusMetricsResponse(
			sessionCount,
			daysWithActivity,
			switchCount,
			medianSessionSeconds,
			longestGapSeconds,
			longestBlock ? FocusBlock.fromJson(longestBlock) : null,
			baseline ? FocusMetricsBaseline.fromJson(baseline) : null,
		)
	}
}
