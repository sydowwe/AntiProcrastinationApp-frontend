import { ActivityStat } from '@/core/activityTracking/dto/response/topDomains/ActivityStat.ts'
import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class DesktopProcessSummaryDto implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public processName: string,
		public productName: string,
		public isNew: boolean,
		public active: ActivityStat | null,
		public background: ActivityStat | null,
	) {}

	static fromJson(json: any): DesktopProcessSummaryDto {
		const { key, label } = readDashboardItem(json, json.processName)
		return new DesktopProcessSummaryDto(
			key,
			label,
			json.processName,
			json.productName,
			json.isNew ?? false,
			json.active ? ActivityStat.fromJson(json.active) : null,
			json.background ? ActivityStat.fromJson(json.background) : null,
		)
	}
}
