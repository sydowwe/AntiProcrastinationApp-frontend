import {HistoryPieChartItem} from '@/dtos/response/historyDashboard/HistoryPieChartItem.ts'
import {HistoryPieTotals} from '@/dtos/response/historyDashboard/HistoryPieTotals.ts'

export class HistoryPieChartResponse {
	constructor(
		public items: HistoryPieChartItem[],
		public totals: HistoryPieTotals,
	) {
	}

	static fromJson(json: any): HistoryPieChartResponse {
		return new HistoryPieChartResponse(
			json.items?.map((i: any) => HistoryPieChartItem.fromJson(i)) ?? [],
			HistoryPieTotals.fromJson(json.totals),
		)
	}
}
