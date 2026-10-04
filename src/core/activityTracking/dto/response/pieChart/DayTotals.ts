export class DayTotals {
	constructor(
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalDomains: number,
		public totalPages: number,
		/** Count of tracked window records, the same unit as `DomainDetailsResponse.entries`. */
		public totalEntries: number,
	) {}

	static fromJson(json: any): DayTotals {
		return new DayTotals(
			json.totalSeconds,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalDomains,
			json.totalPages,
			json.totalEntries ?? 0,
		)
	}
}
