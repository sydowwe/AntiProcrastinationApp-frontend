import {ActivityDateRangeRequest} from '@/dtos/dto/ActivityDateRangeRequest.ts'
import type {ActivityDateRangeType} from '@/dtos/dto/ActivityDateRangeType.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import type {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'

export class HistorySummaryCardsRequest extends ActivityDateRangeRequest {
	constructor(
		date: string,
		rangeType: ActivityDateRangeType,
		public groupBy: HistoryGroupBy,
		public baseline: BaselineType,
		public topN: number,
		endDate?: string,
	) {
		super(date, rangeType, endDate)
	}
}
