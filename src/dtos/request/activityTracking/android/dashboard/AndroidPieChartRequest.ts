import type { Time } from '@/dtos/dto/Time.ts'
import { DateAndTimeRangeRequest } from '@/dtos/request/general/DateAndTimeRangeRequest.ts'

export class AndroidPieChartRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public from: Time,
		public to: Time,
		public minPercent?: number,
	) {
		super(date, from, to)
	}
}
