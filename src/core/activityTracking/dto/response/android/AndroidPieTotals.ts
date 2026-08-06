export class AndroidPieTotals {
	constructor(
		public totalSeconds: number,
		public totalApps: number,
		public totalSessions: number,
	) {}

	static fromJson(json: any): AndroidPieTotals {
		return new AndroidPieTotals(json.totalSeconds, json.totalApps, json.totalSessions)
	}
}
