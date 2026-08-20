export class HistoryGroupItem {
	constructor(
		public groupId: number | null,
		public name: string,
		public totalSeconds: number,
		public color: string | null,
	) {}

	static fromJson(json: any): HistoryGroupItem {
		return new HistoryGroupItem(json.groupId ?? null, json.name, json.totalSeconds, json.color ?? null)
	}
}
