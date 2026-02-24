import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts'
import type {Time} from '@/dtos/dto/Time.ts'
import type {HistoryGroupBy} from '@/components/historyDashboard/types/HistoryGroupBy.ts'
import type {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts'

export class DetailSummaryCardsRequest extends DateAndTimeRangeRequest {
	constructor(
		date: string,
		from: Time,
		to: Time,
		public groupBy: HistoryGroupBy,
		public baseline: BaselineType,
		public topN: number,
	) {
		super(date, from, to)
	}
}
