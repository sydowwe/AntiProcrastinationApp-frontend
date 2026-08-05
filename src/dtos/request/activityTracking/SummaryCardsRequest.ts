import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { BaselineType } from '@/components/activityTracking/summaryCards/BaselineOption.ts'

export class SummaryCardsRequest extends DateAndTimeRangeRequest {
	constructor(
		public readonly date: string,
		public readonly from: Time,
		public readonly to: Time,
		public readonly baseline: BaselineType,
		public readonly topN?: number,
	) {
		super(date, from, to)
	}
}
