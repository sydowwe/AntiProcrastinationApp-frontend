import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class DesktopTimelineSession implements DashboardItem {
	constructor(
		public id: number,
		public key: string,
		public label: string,
		public processName: string,
		public productName: string,
		public startedAt: Date,
		public endedAt: Date,
		public durationSeconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): DesktopTimelineSession {
		const { key, label } = readDashboardItem(json, json.processName)
		return new DesktopTimelineSession(
			json.id,
			key,
			label,
			json.processName,
			json.productName,
			new Date(json.startedAt),
			new Date(json.endedAt),
			json.durationSeconds,
			json.totalSeconds,
		)
	}
}
