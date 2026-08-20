export class HistoryPeriodComparison {
	constructor(
		public previousPeriodTotalSeconds: number,
		public currentPeriodTotalSeconds: number,
		/**
		 * B2: genuinely nullable — null when the previous period total is 0, i.e. there is no baseline.
		 * That is not the same fact as "0% change"; never default it to 0.
		 */
		public percentChange: number | null,
	) {}

	static fromJson(json: any): HistoryPeriodComparison {
		return new HistoryPeriodComparison(
			json.previousPeriodTotalSeconds,
			json.currentPeriodTotalSeconds,
			json.percentChange ?? null,
		)
	}
}
