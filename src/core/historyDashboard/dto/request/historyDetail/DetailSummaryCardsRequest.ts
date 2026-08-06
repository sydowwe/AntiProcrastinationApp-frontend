import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { HistoryGroupBy } from '@/core/historyDashboard/component/types/HistoryGroupBy.ts'
import type { BaselineType } from '@/core/activityTracking/component/summaryCards/BaselineOption.ts'

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
