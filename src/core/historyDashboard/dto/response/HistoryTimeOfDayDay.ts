/**
 * Which hours of one day of the range had anything logged (OP21). This is what lets the time-of-day insight
 * say how *often* its band was used. The 24 hour totals cannot say it: three long mornings and twelve short
 * ones fold into the same buckets, and `HistoryTimeOfDayHour.entries` counts records, not days.
 */
export class HistoryTimeOfDayDay {
	constructor(
		/**
		 * `YYYY-MM-DD` on the user's clock. Kept as the wire string: it is only compared and stepped back
		 * a day, and a `Date` would bring a zone it does not have.
		 */
		public date: string,
		/**
		 * Bit `h` is set when a record touched hour `h` that day. A record crossing midnight marks hour 23
		 * on one day and hour 0 on the next. Never 0: a day with nothing logged is not sent.
		 */
		public hourMask: number,
	) {}

	static fromJson(json: any): HistoryTimeOfDayDay {
		return new HistoryTimeOfDayDay(json.date, json.hourMask ?? 0)
	}

	static listFromObjects(objects: any[]): HistoryTimeOfDayDay[] {
		return objects.map(o => HistoryTimeOfDayDay.fromJson(o))
	}
}
