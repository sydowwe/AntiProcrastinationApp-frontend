import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class AndroidWindowApp implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public packageName: string,
		public appLabel: string,
		public seconds: number,
	) {}

	static fromJson(json: any): AndroidWindowApp {
		const { key, label } = readDashboardItem(json, json.packageName)
		return new AndroidWindowApp(key, label, json.packageName, json.appLabel, json.seconds)
	}
}
