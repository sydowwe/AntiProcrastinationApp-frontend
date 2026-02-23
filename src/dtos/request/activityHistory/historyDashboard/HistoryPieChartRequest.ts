import {ActivityDateRangeRequest} from '@/dtos/dto/ActivityDateRangeRequest.ts'
import type {ActivityDateRangeType} from '@/dtos/dto/ActivityDateRangeType.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

export class HistoryPieChartRequest extends ActivityDateRangeRequest {
	constructor(
		public groupBy: HistoryGroupBy,
		public maxItems: number,
		date: string,
		rangeType: ActivityDateRangeType,
		endDate?: string,
	) {
		super(date, rangeType, endDate)
	}
}
