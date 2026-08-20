import { HistoryPieChartItem } from '@/core/historyDashboard/dto/response/HistoryPieChartItem.ts'
import { HistoryPieTotals } from '@/core/historyDashboard/dto/response/HistoryPieTotals.ts'

export class HistoryPieChartResponse {
	constructor(
		/** B2: always an array, but `[]` whenever the grand total is 0 — `totals` is still sent, zeroed. */
		public items: HistoryPieChartItem[],
		public totals: HistoryPieTotals,
	) {}

	static fromJson(json: any): HistoryPieChartResponse {
		return new HistoryPieChartResponse(
			json.items.map((i: any) => HistoryPieChartItem.fromJson(i)),
			HistoryPieTotals.fromJson(json.totals),
		)
	}
}
