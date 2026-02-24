import {ActivityDateRangeRequest} from '@/dtos/request/activityHistory/ActivityDateRangeRequest.ts'
import type {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

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
