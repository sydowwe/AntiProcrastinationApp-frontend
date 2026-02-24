import {ActivityDateRangeRequest} from '@/dtos/request/activityHistory/ActivityDateRangeRequest.ts'
import type {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import type {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'

export class HistorySummarySummaryCardsRequest extends ActivityDateRangeRequest {
	constructor(
		date: string,
		rangeType: ActivityDateRangeTypeEnum,
		public groupBy: HistoryGroupBy,
		public baseline: BaselineType,
		public topN: number,
		endDate?: string,
	) {
		super(date, rangeType, endDate)
	}
}
