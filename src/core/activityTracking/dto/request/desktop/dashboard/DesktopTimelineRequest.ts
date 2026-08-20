import type { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'

/** Single-day only — see `TimelineRequest` for why the timeline is not requested over a range. */
export class DesktopTimelineRequest extends ActivityRangeRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		public minSeconds?: number,
	) {
		super(dateFrom, dateTo, from, to)
	}
}
