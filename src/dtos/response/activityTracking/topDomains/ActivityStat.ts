export class ActivityStat {
	constructor(
		public seconds: number,
		public averageSeconds: number | null,
		public percentChange: number | null
	) {
	}

	static fromJson(json: any): ActivityStat {
		return new ActivityStat(json.seconds, json.averageSeconds, json.percentChange);
	}
}
