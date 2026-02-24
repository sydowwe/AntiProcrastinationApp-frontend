import type {Time} from '@/dtos/dto/Time.ts';
import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts';

export class StackedBarsRequest extends DateAndTimeRangeRequest {
	constructor(
		public date: string,
		public timeFrom: Time,
		public timeTo: Time,
		public windowMinutes: number
	) {
		super(date, timeFrom, timeTo);
	}
}