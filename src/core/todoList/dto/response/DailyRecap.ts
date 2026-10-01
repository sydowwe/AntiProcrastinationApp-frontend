export class DailyRecapItem {
	constructor(
		public name: string,
		public timeLoggedSeconds: number,
		public itemId: number,
		/** Explicit `null` on the wire when the item carries no reward — every completed item is listed. */
		public pairedLeisureActivityId: number | null,
		/** UTC instant, possibly with fractional seconds — parsed, never string-compared. */
		public completedTimestamp: Date,
		/**
		 * Derived by the server from history (B2): a record of the paired activity started at or after
		 * the completion, the same user day. A reward started but not yet finished has no record yet,
		 * so this stays `false` while its timer runs. Always `false` without a pairing.
		 */
		public rewardTaken: boolean,
	) {}

	static fromJson(json: any) {
		const {
			name,
			timeLoggedSeconds = 0,
			itemId,
			pairedLeisureActivityId = null,
			completedTimestamp,
			rewardTaken = false,
		} = json
		return new DailyRecapItem(
			name,
			timeLoggedSeconds,
			itemId,
			pairedLeisureActivityId,
			new Date(completedTimestamp),
			rewardTaken,
		)
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
