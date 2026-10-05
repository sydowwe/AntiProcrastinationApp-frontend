import { HistoryTimeOfDayHour } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayHour.ts'
import { HistoryTimeOfDayDay } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayDay.ts'

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
		 * Calendar days the range covers. The denominator of "on 12 of 30 days" (OP21). B3 made it honour
		 * `endDate` on a `CustomRange`.
		 */
		public daysInRange: number,
		/** Days in the range with at least one record, by the record's start. The insight's data threshold. */
		public daysWithActivity: number,
		/**
		 * The hours each day of the range touched, ordered by date (OP21). `null` from an API older than
		 * the field, so the insight can tell "no days" from "not sent" and fall back to its plain sentence.
		 *
		 * Unlike `hours`, a tail past the range's last midnight is left out here. A day is the one each
		 * hour fell on, not the record's start, so this can hold more days than `daysWithActivity`.
		 */
		public days: HistoryTimeOfDayDay[] | null = null,
	) {}

	static fromJson(json: any): HistoryTimeOfDayResponse {
		return new HistoryTimeOfDayResponse(
			json.hours?.map((h: any) => HistoryTimeOfDayHour.fromJson(h)) ?? [],
			json.daysInRange ?? 0,
			json.daysWithActivity ?? 0,
			Array.isArray(json.days) ? HistoryTimeOfDayDay.listFromObjects(json.days) : null,
		)
	}
}
