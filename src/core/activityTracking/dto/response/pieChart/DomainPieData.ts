import { type DashboardItem, readDashboardItem } from '@/core/activityTracking/dto/DashboardItem.ts'

export class DomainPieData implements DashboardItem {
	constructor(
		public key: string,
		public label: string,
		public domain: string,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public totalSeconds: number,
		// No page list: the API dropped it (PERF-5). `domain-details` has the ranked one (OP16).
		public entries: number,
	) {}

	static fromJson(json: any): DomainPieData {
		const { key, label } = readDashboardItem(json, json.domain)
		return new DomainPieData(
			key,
			label,
			json.domain,
			json.activeSeconds,
			json.backgroundSeconds,
			json.totalSeconds,
			json.entries,
		)
	}
}
