import { ActivityStat } from '@/dtos/response/activityTracking/topDomains/ActivityStat.ts'

export class AndroidAppSummaryDto {
	constructor(
		public packageName: string,
		public appLabel: string,
		public isNew: boolean,
		public stat: ActivityStat | null,
	) {}

	static fromJson(json: any): AndroidAppSummaryDto {
		return new AndroidAppSummaryDto(
			json.packageName,
			json.appLabel,
			json.isNew ?? false,
			json.stat ? ActivityStat.fromJson(json.stat) : null,
		)
	}
}
