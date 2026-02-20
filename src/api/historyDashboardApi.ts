import {API} from '@/plugins/axiosConfig'
import type {HistoryStackedBarsRequest} from '@/dtos/request/historyDashboard/HistoryStackedBarsRequest.ts'
import type {HistoryPieChartRequest} from '@/dtos/request/historyDashboard/HistoryPieChartRequest.ts'
import type {HistorySummaryCardsRequest} from '@/dtos/request/historyDashboard/HistorySummaryCardsRequest.ts'
import {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'

const BASE_URL = '/activity-history/dashboard'

export async function getHistoryStackedBars(
	request: HistoryStackedBarsRequest
): Promise<HistoryStackedBarsResponse> {
	const {data} = await API.post(`${BASE_URL}/stacked-bars`, request)
	return HistoryStackedBarsResponse.fromJson(data)
}

export async function getHistoryPieChart(
	request: HistoryPieChartRequest
): Promise<HistoryPieChartResponse> {
	const {data} = await API.post(`${BASE_URL}/pie-chart`, request)
	return HistoryPieChartResponse.fromJson(data)
}

export async function getHistorySummaryCards(
	request: HistorySummaryCardsRequest
): Promise<HistorySummaryCardsResponse> {
	const {data} = await API.post(`${BASE_URL}/summary-cards`, request)
	return HistorySummaryCardsResponse.fromJson(data)
}
