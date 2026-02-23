import {DateAndTimeRangeRequest} from '@/dtos/dto/DateAndTimeRangeRequest.ts';
import type {Time} from '@/utils/Time.ts';

export class DetailTimelineRequest extends DateAndTimeRangeRequest {
	constructor(
		date: string,
		from: Time,
		to: Time
	) {
		super(date, from, to);
	}
}