import { HistoryGroupItem } from '@/core/historyDashboard/dto/response/HistoryGroupItem.ts'

export class HistoryWindow {
	constructor(
		/** B2: always present, and always ISO 8601 with a `Z` — a UTC *instant*, not a wall clock. */
		public windowStart: string,
		public windowEnd: string,
		/** B2: always an array, but `[]` for any window with no activity — which is most of them. */
		public items: HistoryGroupItem[],
	) {}

	static fromJson(json: any): HistoryWindow {
		return new HistoryWindow(
			json.windowStart,
			json.windowEnd,
			json.items.map((i: any) => HistoryGroupItem.fromJson(i)),
		)
	}
}
