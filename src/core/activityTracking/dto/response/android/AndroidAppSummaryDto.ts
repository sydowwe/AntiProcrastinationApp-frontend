import { ActivityStat } from '@/core/activityTracking/dto/response/topDomains/ActivityStat.ts'
import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class AndroidAppSummaryDto implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public packageName: string,
		public appLabel: string,
		public isNew: boolean,
		public stat: ActivityStat | null,
	) {}

	static fromJson(json: any): AndroidAppSummaryDto {
		const { key, label } = readDashboardItem(json, json.packageName)
		return new AndroidAppSummaryDto(
			key,
			label,
			json.packageName,
			json.appLabel,
			json.isNew ?? false,
			json.stat ? ActivityStat.fromJson(json.stat) : null,
		)
	}
}
