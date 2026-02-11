import {DateAndTimeRangeRequest} from '@/dtos/request/activityTracking/DateAndTimeRangeRequest.ts';
import type {Time} from '@/utils/Time.ts';

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