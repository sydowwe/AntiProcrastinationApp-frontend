import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class WindowActivity implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public domain: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		public url?: string,
	) {}

	static fromJson(json: any): WindowActivity {
		const { key, label } = readDashboardItem(json, json.domain)
		return new WindowActivity(
			key,
			label,
			json.domain,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
			json.url,
		)
	}
}
