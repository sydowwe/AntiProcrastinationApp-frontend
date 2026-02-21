import {DateAndTimeRangeRequest} from '@/dtos/dto/DateAndTimeRangeRequest.ts';
import type {Time} from '@/utils/Time.ts';

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