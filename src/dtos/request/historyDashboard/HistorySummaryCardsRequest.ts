import {HistoryDateRangeRequest} from '@/dtos/request/historyDashboard/HistoryDateRangeRequest.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import type {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'

export class HistorySummaryCardsRequest extends HistoryDateRangeRequest {
	constructor(
		public dateFrom: string,
		public dateTo: string,
		public groupBy: HistoryGroupBy,
		public baseline: BaselineType,
		public topN: number,
	) {
		super(dateFrom, dateTo, groupBy)
	}
}
