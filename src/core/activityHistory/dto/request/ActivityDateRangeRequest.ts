import type { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'

export class ActivityDateRangeRequest {
	constructor(
		public date: string,
		public rangeType: ActivityDateRangeTypeEnum,
		public endDate?: string,
	) {}
}
