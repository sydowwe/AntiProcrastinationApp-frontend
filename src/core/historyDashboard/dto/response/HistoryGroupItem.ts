export class HistoryGroupItem {
	constructor(
		public groupId: number | null,
		public name: string,
		public totalSeconds: number,
		/**
		 * B2: null on **every** row of an activity-grouped response (activities carry no colour) and on
		 * `Uncategorized`. Resolve through `resolveHistoryGroupColor`, never render this raw.
		 */
		public color: string | null,
	) {}

	static fromJson(json: any): HistoryGroupItem {
		return new HistoryGroupItem(json.groupId ?? null, json.name, json.totalSeconds, json.color ?? null)
	}
}
