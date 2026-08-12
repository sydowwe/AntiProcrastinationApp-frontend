export class DailyRecapItem {
	constructor(
		public name: string,
		public timeLoggedSeconds: number,
	) {}

	static fromJson(json: any) {
		return new DailyRecapItem(json.name, json.timeLoggedSeconds)
	}
}

export class DailyRecap {
	constructor(
		public items: DailyRecapItem[],
		public totalTimeLoggedSeconds: number,
	) {}

	static fromJson(json: any) {
		return new DailyRecap(
			(json.items ?? []).map((item: any) => DailyRecapItem.fromJson(item)),
			json.totalTimeLoggedSeconds ?? 0,
		)
	}
}
