import {HistoryDateRangeRequest} from '@/dtos/request/historyDashboard/HistoryDateRangeRequest.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

export class HistoryStackedBarsRequest extends HistoryDateRangeRequest {
	constructor(
		public dateFrom: string,
		public dateTo: string,
		public groupBy: HistoryGroupBy,
	) {
		super(dateFrom, dateTo, groupBy)
	}
}
