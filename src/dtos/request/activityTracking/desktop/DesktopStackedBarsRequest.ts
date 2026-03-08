import type {Time} from '@/dtos/dto/Time.ts'
import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts'

export class DesktopStackedBarsRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public from: Time,
		public to: Time,
		public windowMinutes: number,
		public minSeconds?: number
	) {
		super(date, from, to)
	}
}
