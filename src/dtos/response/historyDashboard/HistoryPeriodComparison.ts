export class HistoryPeriodComparison {
	constructor(
		public previousPeriodTotalSeconds: number,
		public currentPeriodTotalSeconds: number,
		public percentChange: number | null,
	) {
	}

	static fromJson(json: any): HistoryPeriodComparison {
		return new HistoryPeriodComparison(
			json.previousPeriodTotalSeconds,
			json.currentPeriodTotalSeconds,
			json.percentChange ?? null,
		)
	}
}
