export class DayTotals {
	constructor(
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalDomains: number,
		public totalPages: number,
		public totalVisits?: number
	) {}
}
