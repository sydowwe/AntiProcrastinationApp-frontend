import {HistoryDateRangeRequest} from '@/dtos/request/historyDashboard/HistoryDateRangeRequest.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

export class HistoryPieChartRequest extends HistoryDateRangeRequest {
	constructor(
		public dateFrom: string,
		public dateTo: string,
		public groupBy: HistoryGroupBy,
		public minPercent: number,
	) {
		super(dateFrom, dateTo, groupBy)
	}
}
