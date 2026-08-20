export class HistoryPieChartItem {
	constructor(
		public groupId: number | null,
		public name: string,
		public totalSeconds: number,
		public color: string | null,
		public entries: number,
	) {}

	static fromJson(json: any): HistoryPieChartItem {
		return new HistoryPieChartItem(
			json.groupId ?? null,
			json.name,
			json.totalSeconds,
			json.color ?? null,
			json.entries,
		)
	}
}
