import {DesktopProcessPieData} from './DesktopProcessPieData.ts'
import {DesktopPieTotals} from './DesktopPieTotals.ts'

export class DesktopPieChartResponse {
	constructor(
		public processes: DesktopProcessPieData[],
		public totals: DesktopPieTotals
	) {
	}

	static fromJson(json: any): DesktopPieChartResponse {
		return new DesktopPieChartResponse(
			json.processes.map((p: any) => DesktopProcessPieData.fromJson(p)),
			DesktopPieTotals.fromJson(json.totals)
		)
	}
}
