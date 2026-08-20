import { HistoryTimeOfDayHour } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayHour.ts'

/**
 * The range folded into hours of the day — the one shape none of the other dashboard endpoints exposes,
 * and the reason this endpoint exists rather than a client-side fold of `summary/stacked-bars` (whose
 * bucket width and daily clipping are both chart controls the user moves).
 *
 * Records are selected by `startTimestamp` inside the range and each record's **whole** length is
 * distributed, tails past the range end included: a record starting 23:40 on the last day puts 20 minutes
 * into hour 0. That is deliberate and is exactly what makes the pie-chart total equality hold — it is not
 * an off-by-one.
 */
export class HistoryTimeOfDayResponse {
	constructor(
		/**
		 * Always 24 elements, ordered `hour` 0…23, zeros included. Indexed by position; never sorted or
		 * padded by this client.
		 */
		public hours: HistoryTimeOfDayHour[],
		/**
		 * Calendar days the range covers, so a total can become a per-day figure without re-deriving the
		 * range's length.
		 *
		 * B3: reads `2` for **any** `CustomRange` request regardless of the `endDate` sent, because
		 * `DateRangeDto.ToDateRange()` never reads `endDate` and a `to <= from` guard widens the result to
		 * two days. That is pre-existing and shared by all four `summary/` endpoints — see
		 * `prompts/activity-history/backend/B3-custom-range.md`.
		 */
		public daysInRange: number,
		/** Days in the range with at least one record. The insight's data threshold. */
		public daysWithActivity: number,
	) {}

	static fromJson(json: any): HistoryTimeOfDayResponse {
		return new HistoryTimeOfDayResponse(
			json.hours?.map((h: any) => HistoryTimeOfDayHour.fromJson(h)) ?? [],
			json.daysInRange ?? 0,
			json.daysWithActivity ?? 0,
		)
	}
}
