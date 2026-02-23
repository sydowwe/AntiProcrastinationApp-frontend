import {DateAndTimeRangeRequest} from '@/dtos/dto/DateAndTimeRangeRequest.ts'
import type {Time} from '@/utils/Time.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'

export class DetailStackedBarsRequest extends DateAndTimeRangeRequest {
	constructor(
		date: string,
		from: Time,
		to: Time,
		public windowMinutes: number,
		public groupBy?: HistoryGroupBy,
	) {
		super(date, from, to)
	}
}
