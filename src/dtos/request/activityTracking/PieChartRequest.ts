import {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts';
import type {Time} from '@/dtos/dto/Time.ts';

export class PieChartRequest extends DateAndTimeRangeRequest {
	constructor(
		public readonly date: string,
		public readonly from: Time,
		public readonly to: Time,
		public minPercent: number,
	) {
		super(date, from, to);
	}
}