import type { Time } from '@/_common/dto/dto/Time.ts'
import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'

export class StackedBarsRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public timeFrom: Time,
		public timeTo: Time,
		public windowMinutes: number,
	) {
		super(date, timeFrom, timeTo)
	}
}
