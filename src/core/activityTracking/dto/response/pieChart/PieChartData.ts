import { DomainPieData } from '@/core/activityTracking/dto/response/pieChart/DomainPieData.ts'
import { DayTotals } from '@/core/activityTracking/dto/response/pieChart/DayTotals.ts'

export class PieChartData {
	constructor(
		public domains: DomainPieData[],
		public totals: DayTotals,
	) {}

	static fromJson(json: any): PieChartData {
		return new PieChartData(
			json.domains.map((domain: any) => DomainPieData.fromJson(domain)),
			DayTotals.fromJson(json.totals),
		)
	}
}
