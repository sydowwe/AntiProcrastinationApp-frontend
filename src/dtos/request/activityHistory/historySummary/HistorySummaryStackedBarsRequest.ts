import {ActivityDateRangeRequest} from '@/dtos/request/activityHistory/ActivityDateRangeRequest.ts'
import type {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import type {Time} from '@/dtos/dto/Time.ts';

export class HistorySummaryStackedBarsRequest extends ActivityDateRangeRequest {
	constructor(
		date: string,
		rangeType: ActivityDateRangeTypeEnum,
		public windowMinutes: number,
		public windowStartTime: Time,
		public windowEndTime: Time,
		endDate?: string,
		public groupBy?: HistoryGroupBy,
	) {
		super(date, rangeType, endDate)
	}
}
