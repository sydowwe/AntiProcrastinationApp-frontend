import { HistorySummaryCard } from '@/core/historyDashboard/dto/response/HistorySummaryCard.ts'
import { HistoryPeriodComparison } from '@/core/historyDashboard/dto/response/HistoryPeriodComparison.ts'

export class HistorySummaryCardsResponse {
	constructor(
		public cards: HistorySummaryCard[],
		public periodComparison: HistoryPeriodComparison,
	) {}

	static fromJson(json: any): HistorySummaryCardsResponse {
		return new HistorySummaryCardsResponse(
			json.cards?.map((c: any) => HistorySummaryCard.fromJson(c)) ?? [],
			HistoryPeriodComparison.fromJson(json.periodComparison),
		)
	}
}
