import { HistoryWindow } from '@/core/historyDashboard/dto/response/HistoryWindow.ts'

export class HistoryStackedBarsResponse {
	constructor(public windows: HistoryWindow[]) {}

	static fromJson(json: any): HistoryStackedBarsResponse {
		return new HistoryStackedBarsResponse(json.windows?.map((w: any) => HistoryWindow.fromJson(w)) ?? [])
	}
}
