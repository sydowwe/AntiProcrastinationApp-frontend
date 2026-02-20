export class HistoryPieTotals {
	constructor(
		public totalSeconds: number,
		public totalEntries: number,
		public uniqueGroups: number,
	) {
	}

	static fromJson(json: any): HistoryPieTotals {
		return new HistoryPieTotals(
			json.totalSeconds,
			json.totalEntries,
			json.uniqueGroups,
		)
	}
}
