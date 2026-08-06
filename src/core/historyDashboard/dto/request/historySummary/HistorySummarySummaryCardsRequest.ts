import { ActivityDateRangeRequest } from '@/core/activityHistory/dto/request/ActivityDateRangeRequest.ts'
import type { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
import type { HistoryGroupBy } from '@/core/historyDashboard/component/types/HistoryGroupBy.ts'
import type { BaselineType } from '@/core/activityTracking/component/summaryCards/BaselineOption.ts'

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
