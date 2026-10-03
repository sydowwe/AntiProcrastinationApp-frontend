import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

/**
 * One timeline block, shared by all four dashboards. Colour and click-selection read `key`; the block,
 * tooltip and legend print `label` — see `DashboardItem`.
 */
export class TimelineSessionDto implements DashboardItem {
	constructor(
		public id: number,
		public key: string,
		public label: string,
		public startedAt: Date,
		public endedAt: Date,
		public durationSeconds: number,
		public totalSeconds: number,
		public url?: string,
	) {}

	static fromJson(json: any): TimelineSessionDto {
		const { key, label } = readDashboardItem(json, json.domain)
		return new TimelineSessionDto(
			json.id,
			key,
			label,
			new Date(json.startedAt),
			new Date(json.endedAt),
			json.durationSeconds,
			json.totalSeconds,
			json.url,
		)
	}
}
