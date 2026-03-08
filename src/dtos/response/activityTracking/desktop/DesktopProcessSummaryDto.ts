import {ActivityStat} from '@/dtos/response/activityTracking/topDomains/ActivityStat.ts'

export class DesktopProcessSummaryDto {
	constructor(
		public processName: string,
		public productName: string,
		public isNew: boolean,
		public active: ActivityStat | null,
		public background: ActivityStat | null
	) {
	}

	static fromJson(json: any): DesktopProcessSummaryDto {
		return new DesktopProcessSummaryDto(
			json.processName,
			json.productName,
			json.isNew ?? false,
			json.active ? ActivityStat.fromJson(json.active) : null,
			json.background ? ActivityStat.fromJson(json.background) : null
		)
	}
}
