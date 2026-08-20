import type { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'

export class PieChartRequest extends ActivityRangeRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		public minPercent: number,
	) {
		super(dateFrom, dateTo, from, to)
	}
}
