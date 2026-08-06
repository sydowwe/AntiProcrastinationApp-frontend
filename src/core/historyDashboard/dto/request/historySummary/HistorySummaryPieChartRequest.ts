import { ActivityDateRangeRequest } from '@/core/activityHistory/dto/request/ActivityDateRangeRequest.ts'
import type { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
import type { HistoryGroupBy } from '@/core/historyDashboard/component/types/HistoryGroupBy.ts'

export class HistorySummaryPieChartRequest extends ActivityDateRangeRequest {
	constructor(
		public groupBy: HistoryGroupBy,
		public maxItems: number,
		date: string,
		rangeType: ActivityDateRangeTypeEnum,
		endDate?: string,
	) {
		super(date, rangeType, endDate)
	}
}
