import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

export class HistoryDateRangeRequest {
	constructor(
		public dateFrom: string,
		public dateTo: string,
		public groupBy: HistoryGroupBy,
	) {
	}
}
