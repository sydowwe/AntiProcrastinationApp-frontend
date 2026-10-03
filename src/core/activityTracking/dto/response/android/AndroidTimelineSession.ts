import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class AndroidTimelineSession implements DashboardItem {
	constructor(
		public id: number,
		public key: string,
		public label: string,
		public packageName: string,
		public appLabel: string,
		public startedAt: Date,
		public endedAt: Date,
		public durationSeconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): AndroidTimelineSession {
		const { key, label } = readDashboardItem(json, json.packageName)
		return new AndroidTimelineSession(
			json.id,
			key,
			label,
			json.packageName,
			json.appLabel,
			new Date(json.startedAt),
			new Date(json.endedAt),
			json.durationSeconds,
			json.totalSeconds,
		)
	}
}
