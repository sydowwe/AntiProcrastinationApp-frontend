import type { Time } from '@/dtos/dto/Time.ts'
import { DateAndTimeRangeRequest } from '@/dtos/request/general/DateAndTimeRangeRequest.ts'

export class AndroidTimelineRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public from: Time,
		public to: Time,
		public minSeconds?: number,
	) {
		super(date, from, to)
	}
}
