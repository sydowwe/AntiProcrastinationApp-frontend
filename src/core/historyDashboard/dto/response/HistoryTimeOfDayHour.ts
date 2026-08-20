export class HistoryTimeOfDayHour {
	constructor(
		/** 0–23, hour of day in the user's configured timezone (`User.timezone`) — never UTC. */
		public hour: number,
		/**
		 * Seconds logged in this hour of day, summed over every day in the range. `0` for an empty hour,
		 * never null.
		 *
		 * A record crossing an hour boundary is split across the hours it covers by elapsed time, so 90
		 * minutes from 09:45 is 900 s in hour 9, 3600 s in hour 10 and 900 s in hour 11. Summed over all
		 * 24 buckets this is the period total, and equals `summary/pie-chart`'s `totals.totalSeconds` for
		 * the same range — the backend has a test asserting that equality.
		 */
		public totalSeconds: number,
		/**
		 * How many records touched this hour. A record is counted once **per hour it touches**, so
		 * `sum(hours[].entries)` is emphatically *not* the period's record count and must never be used as
		 * one — `summary/pie-chart`'s `totals.totalEntries` is the number for that.
		 */
		public entries: number,
	) {}

	static fromJson(json: any): HistoryTimeOfDayHour {
		return new HistoryTimeOfDayHour(json.hour, json.totalSeconds ?? 0, json.entries ?? 0)
	}
}
