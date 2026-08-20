import { ActivityDateRangeRequest } from '@/core/activityHistory/dto/request/ActivityDateRangeRequest.ts'
import type { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
import type { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'

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
