import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts'
import type {Time} from '@/dtos/dto/Time.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

export class DetailPieChartRequest extends DateAndTimeRangeRequest {
	constructor(
		public groupBy: HistoryGroupBy,
		public maxItems: number,
		date: string,
		from: Time,
		to: Time,
	) {
		super(date, from, to)
	}
}
