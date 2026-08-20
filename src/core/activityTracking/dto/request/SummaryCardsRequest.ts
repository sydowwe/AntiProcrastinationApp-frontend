import type { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'
import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'

export class SummaryCardsRequest extends ActivityRangeRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		public readonly baseline: BaselineType,
		public readonly topN?: number,
	) {
		super(dateFrom, dateTo, from, to)
	}
}
