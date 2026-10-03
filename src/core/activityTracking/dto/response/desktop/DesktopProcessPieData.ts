import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class DesktopProcessPieData implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public processName: string,
		public productName: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		public windowTitles: string[],
		public entries: number,
	) {}

	static fromJson(json: any): DesktopProcessPieData {
		const { key, label } = readDashboardItem(json, json.processName)
		return new DesktopProcessPieData(
			key,
			label,
			json.processName,
			json.productName,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
			json.windowTitles ?? [],
			json.entries,
		)
	}
}
