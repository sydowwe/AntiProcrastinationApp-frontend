import {HistoryWindow} from '@/dtos/response/historyDashboard/HistoryWindow.ts'

export type HistoryGranularity = 'HOURLY' | 'DAILY' | 'WEEKLY'

export class HistoryStackedBarsResponse {
	constructor(
		public granularity: HistoryGranularity,
		public windows: HistoryWindow[],
	) {
	}

	static fromJson(json: any): HistoryStackedBarsResponse {
		return new HistoryStackedBarsResponse(
			json.granularity,
			json.windows?.map((w: any) => HistoryWindow.fromJson(w)) ?? [],
		)
	}
}
