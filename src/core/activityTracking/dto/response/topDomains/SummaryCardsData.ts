import { ActivityStat } from '@/core/activityTracking/dto/response/topDomains/ActivityStat.ts'
import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

/** One summary card. Selection reads `key`, the card prints `label` — see `DashboardItem`. */
export class SummaryCardsData implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public active: ActivityStat | null,
		public background: ActivityStat | null,
		public totalSeconds: number,
		public isNew: boolean,
	) {}

	static fromJson(json: any): SummaryCardsData {
		const { key, label } = readDashboardItem(json, json.domain)
		return new SummaryCardsData(
			key,
			label,
			json.active ? ActivityStat.fromJson(json.active) : null,
			json.background ? ActivityStat.fromJson(json.background) : null,
			json.totalSeconds,
			json.isNew ?? false,
		)
	}
}
