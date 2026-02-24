import {ActivityDateRangeTypeEnum} from '@/dtos/request/activityHistory/ActivityDateRangeTypeEnum.ts'

export class ActivityDateRangeRequest {
	constructor(
		public date: string,
		public rangeType: ActivityDateRangeTypeEnum,
		public endDate?: string,
	) {
	}
}
