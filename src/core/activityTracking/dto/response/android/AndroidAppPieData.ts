import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class AndroidAppPieData implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public packageName: string,
		public appLabel: string,
		public seconds: number,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): AndroidAppPieData {
		const { key, label } = readDashboardItem(json, json.packageName)
		return new AndroidAppPieData(key, label, json.packageName, json.appLabel, json.seconds, json.totalSeconds)
	}
}
