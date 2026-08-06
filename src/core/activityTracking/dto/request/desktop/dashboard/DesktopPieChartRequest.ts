import type { Time } from '@/_common/dto/dto/Time.ts'
import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'

export class DesktopPieChartRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public from: Time,
		public to: Time,
		public minPercent?: number,
	) {
		super(date, from, to)
	}
}
