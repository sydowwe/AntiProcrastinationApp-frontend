import type {Time} from '@/dtos/dto/Time.ts';

export class DateAndTimeRangeRequest {
	constructor(
		public readonly date: string,
		public readonly from: Time,
		public readonly to: Time
	) {
	}
}