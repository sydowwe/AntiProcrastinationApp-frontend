import type {Time} from '@/utils/Time.ts';
import {DateAndTimeRangeRequest} from '@/dtos/dto/DateAndTimeRangeRequest.ts';

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