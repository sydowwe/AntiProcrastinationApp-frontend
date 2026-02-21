import {ActivityDateRangeRequest} from '@/dtos/dto/ActivityDateRangeRequest.ts'
import type {ActivityDateRangeType} from '@/dtos/dto/ActivityDateRangeType.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy'

export class DashboardStackedBarsRequest extends ActivityDateRangeRequest {
	constructor(
		date: string,
		rangeType: ActivityDateRangeType,
		public windowMinutes: number,
		endDate?: string,
		public groupBy?: HistoryGroupBy,
	) {
		super(date, rangeType, endDate)
	}
}
