import {ActivityDateRangeType} from '@/dtos/dto/ActivityDateRangeType.ts'

export class ActivityDateRangeRequest {
	constructor(
		public date: string,
		public rangeType: ActivityDateRangeType,
		public endDate?: string,
	) {
	}
}
