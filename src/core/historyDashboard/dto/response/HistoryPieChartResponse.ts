import { HistoryPieChartItem } from '@/core/historyDashboard/dto/response/HistoryPieChartItem.ts'
import { HistoryPieTotals } from '@/core/historyDashboard/dto/response/HistoryPieTotals.ts'

export class HistoryPieChartResponse {
	constructor(
		public items: HistoryPieChartItem[],
		public totals: HistoryPieTotals,
	) {}

	static fromJson(json: any): HistoryPieChartResponse {
		return new HistoryPieChartResponse(
			json.items?.map((i: any) => HistoryPieChartItem.fromJson(i)) ?? [],
			HistoryPieTotals.fromJson(json.totals),
		)
	}
}
