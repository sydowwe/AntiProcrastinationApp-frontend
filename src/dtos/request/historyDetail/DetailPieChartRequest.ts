import {DateAndTimeRangeRequest} from '@/dtos/dto/DateAndTimeRangeRequest.ts'
import type {Time} from '@/utils/Time'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy'

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
