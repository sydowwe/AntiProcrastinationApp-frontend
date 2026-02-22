import {API} from '@/plugins/axiosConfig'
import type {DashboardStackedBarsRequest} from '@/dtos/request/DashboardStackedBarsRequest'
import type {HistoryPieChartRequest} from '@/dtos/request/historyDashboard/HistoryPieChartRequest.ts'
import type {HistorySummaryCardsRequest} from '@/dtos/request/historyDashboard/HistorySummaryCardsRequest.ts'
import type {DetailStackedBarsRequest} from '@/dtos/request/historyDetail/DetailStackedBarsRequest.ts'
import type {DetailPieChartRequest} from '@/dtos/request/historyDetail/DetailPieChartRequest.ts'
import type {DetailSummaryCardsRequest} from '@/dtos/request/historyDetail/DetailSummaryCardsRequest.ts'
import {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import type {CalendarActivityRequest} from '@/dtos/request/historyDashboard/CalendarActivityRequest.ts'
import {CalendarActivityDaySummary} from '@/dtos/response/historyDashboard/CalendarActivityDaySummary.ts'

const SUMMARY_URL = '/activity-history/dashboard/summary'
const DETAIL_URL = '/activity-history/dashboard/detail'

// --- Summary (multi-day, ActivityDateRangeRequest based) ---

export async function getSummaryStackedBars(
	request: DashboardStackedBarsRequest
): Promise<HistoryStackedBarsResponse> {
	const {data} = await API.post(`${SUMMARY_URL}/stacked-bars`, request)
	return HistoryStackedBarsResponse.fromJson(data)
}

export async function getSummaryPieChart(
	request: HistoryPieChartRequest
): Promise<HistoryPieChartResponse> {
	const {data} = await API.post(`${SUMMARY_URL}/pie-chart`, request)
	return HistoryPieChartResponse.fromJson(data)
}

export async function getSummarySummaryCards(
	request: HistorySummaryCardsRequest
): Promise<HistorySummaryCardsResponse> {
	const {data} = await API.post(`${SUMMARY_URL}/summary-cards`, request)
	return HistorySummaryCardsResponse.fromJson(data)
}

// --- Detail (single-day, DateAndTimeRangeRequest based) ---

export async function getDetailStackedBars(
	request: DetailStackedBarsRequest
): Promise<HistoryStackedBarsResponse> {
	const {data} = await API.post(`${DETAIL_URL}/stacked-bars`, request)
	return HistoryStackedBarsResponse.fromJson(data)
}

export async function getDetailPieChart(
	request: DetailPieChartRequest
): Promise<HistoryPieChartResponse> {
	const {data} = await API.post(`${DETAIL_URL}/pie-chart`, request)
	return HistoryPieChartResponse.fromJson(data)
}

export async function getDetailSummaryCards(
	request: DetailSummaryCardsRequest
): Promise<HistorySummaryCardsResponse> {
	const {data} = await API.post(`${DETAIL_URL}/summary-cards`, request)
	return HistorySummaryCardsResponse.fromJson(data)
}

// --- Calendar Activity Summary (per-day activity breakdown for calendar view) ---

export async function getCalendarActivitySummary(
	request: CalendarActivityRequest
): Promise<CalendarActivityDaySummary[]> {
	const {data} = await API.post('/activity-history/dashboard/calendar', request)
	return data.map((d: any) => CalendarActivityDaySummary.fromJson(d))
}
