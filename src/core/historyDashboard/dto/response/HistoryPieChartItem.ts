export class HistoryPieChartItem {
	constructor(
		public groupId: number | null,
		public name: string,
		public totalSeconds: number,
		/**
		 * B2: null on **every** row of an activity-grouped response (activities carry no colour) and on
		 * `Uncategorized`. Resolve through `resolveHistoryGroupColor`, never render this raw.
		 */
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
