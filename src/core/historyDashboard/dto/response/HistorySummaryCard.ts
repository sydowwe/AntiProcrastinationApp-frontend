export class HistorySummaryCard {
	constructor(
		public groupId: number | null,
		public name: string,
		public color: string | null,
		public totalSeconds: number,
		public averageSeconds: number,
		public percentChange: number | null,
		public isNew: boolean,
	) {}

	static fromJson(json: any): HistorySummaryCard {
		return new HistorySummaryCard(
			json.groupId ?? null,
			json.name,
			json.color ?? null,
			json.totalSeconds,
			json.averageSeconds,
			json.percentChange ?? null,
			json.isNew ?? false,
		)
	}
}
