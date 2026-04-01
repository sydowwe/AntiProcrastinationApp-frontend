import type { Time } from '@/dtos/dto/Time.ts'
import { DateAndTimeRangeRequest } from '@/dtos/request/general/DateAndTimeRangeRequest.ts'
import type { BaselineType } from '@/components/activityTracking/summaryCards/BaselineOption.ts'

export class DesktopSummaryCardsRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public from: Time,
		public to: Time,
		public baseline: BaselineType,
		public topN?: number,
	) {
		super(date, from, to)
	}
}
