import { HistoryGroupItem } from '@/core/historyDashboard/dto/response/HistoryGroupItem.ts'

export class HistoryWindow {
	constructor(
		public windowStart: string,
		public windowEnd: string,
		public items: HistoryGroupItem[],
	) {}

	static fromJson(json: any): HistoryWindow {
		return new HistoryWindow(
			json.windowStart,
			json.windowEnd,
			json.items?.map((i: any) => HistoryGroupItem.fromJson(i)) ?? [],
		)
	}
}
