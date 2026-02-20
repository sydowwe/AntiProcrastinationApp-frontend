export class HistoryGroupItem {
	constructor(
		public name: string,
		public totalSeconds: number,
		public color: string | null,
	) {
	}

	static fromJson(json: any): HistoryGroupItem {
		return new HistoryGroupItem(
			json.name,
			json.totalSeconds,
			json.color ?? null,
		)
	}
}
