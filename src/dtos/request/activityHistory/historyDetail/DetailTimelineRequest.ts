import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts';
import type {Time} from '@/dtos/dto/Time.ts';

export class DetailTimelineRequest extends DateAndTimeRangeRequest {
	constructor(
		date: string,
		from: Time,
		to: Time
	) {
		super(date, from, to);
	}
}