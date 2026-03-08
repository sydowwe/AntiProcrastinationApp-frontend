export class DesktopPieTotals {
	constructor(
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalProcesses: number,
		public totalWindowTitles: number,
		public totalEntries: number
	) {
	}

	static fromJson(json: any): DesktopPieTotals {
		return new DesktopPieTotals(
			json.totalSeconds,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalProcesses,
			json.totalWindowTitles,
			json.totalEntries
		)
	}
}
