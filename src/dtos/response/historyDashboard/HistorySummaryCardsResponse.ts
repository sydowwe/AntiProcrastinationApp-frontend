import {HistorySummaryCard} from '@/dtos/response/historyDashboard/HistorySummaryCard.ts'
import {HistoryPeriodComparison} from '@/dtos/response/historyDashboard/HistoryPeriodComparison.ts'

export class HistorySummaryCardsResponse {
	constructor(
		public cards: HistorySummaryCard[],
		public periodComparison: HistoryPeriodComparison,
	) {
	}

	static fromJson(json: any): HistorySummaryCardsResponse {
		return new HistorySummaryCardsResponse(
			json.cards?.map((c: any) => HistorySummaryCard.fromJson(c)) ?? [],
			HistoryPeriodComparison.fromJson(json.periodComparison),
		)
	}
}
