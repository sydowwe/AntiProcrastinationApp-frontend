import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class DesktopWindowActivity implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public processName: string,
		public productName: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): DesktopWindowActivity {
		const { key, label } = readDashboardItem(json, json.processName)
		return new DesktopWindowActivity(
			key,
			label,
			json.processName,
			json.productName,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
		)
	}
}
