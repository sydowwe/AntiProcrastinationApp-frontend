import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'

export class DetailTimelineRequest extends DateAndTimeRangeRequest {
	constructor(date: string, from: Time, to: Time) {
		super(date, from, to)
	}
}
