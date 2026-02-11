import {DomainPieData} from '@/dtos/response/activityTracking/pieChart/DomainPieData.ts';
import {DayTotals} from '@/dtos/response/activityTracking/pieChart/DayTotals.ts';

export class PieChartData {
	constructor(
		public domains: DomainPieData[],
		public totals: DayTotals
	) {
	}

	static fromJson(json: any): PieChartData {
		return new PieChartData(
			json.domains.map((domain: any) => DomainPieData.fromJson(domain)),
			DayTotals.fromJson(json.totals)
		);
	}
}