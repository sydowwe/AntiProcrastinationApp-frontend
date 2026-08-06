import { AndroidAppPieData } from './AndroidAppPieData.ts'
import { AndroidPieTotals } from './AndroidPieTotals.ts'

export class AndroidPieChartResponse {
	constructor(
		public apps: AndroidAppPieData[],
		public totals: AndroidPieTotals,
	) {}

	static fromJson(json: any): AndroidPieChartResponse {
		return new AndroidPieChartResponse(
			json.apps?.map((a: any) => AndroidAppPieData.fromJson(a)) ?? [],
			AndroidPieTotals.fromJson(json.totals),
		)
	}
}
