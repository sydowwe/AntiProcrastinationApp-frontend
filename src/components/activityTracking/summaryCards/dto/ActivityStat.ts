export class ActivityStat {
	constructor(
		public seconds: number,
		public averageSeconds: number | null,
		public percentChange: number | null
	) {}
}
