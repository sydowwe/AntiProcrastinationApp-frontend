import {DateAndTimeRangeRequest} from '@/dtos/request/activityTracking/DateAndTimeRangeRequest.ts';
import type {Time} from '@/utils/Time.ts';
import {BaselineType} from '@/components/activityTracking/summaryCards/BaselineOption.ts';

export class SummaryCardsRequest extends DateAndTimeRangeRequest {
	constructor(
		public readonly date: string,
		public readonly from: Time,
		public readonly to: Time,
		public readonly baseline: BaselineType,
		public readonly topN?: number
	) {
		super(date, from, to);
	}
}