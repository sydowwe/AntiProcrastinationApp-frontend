import type { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'
import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'

export class DesktopSummaryCardsRequest extends ActivityRangeRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		public baseline: BaselineType,
		public topN?: number,
	) {
		super(dateFrom, dateTo, from, to)
	}
}
