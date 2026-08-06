import { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'

export class PieChartRequest extends DateAndTimeRangeRequest {
	constructor(
		public readonly date: string,
		public readonly from: Time,
		public readonly to: Time,
		public minPercent: number,
	) {
		super(date, from, to)
	}
}
