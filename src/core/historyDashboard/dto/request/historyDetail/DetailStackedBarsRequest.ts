import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'

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
