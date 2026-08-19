import type { Time } from '@/_common/dto/dto/Time.ts'
import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'

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
