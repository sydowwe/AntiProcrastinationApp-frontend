import {API} from '@/plugins/axiosConfig'
import type {DetailStackedBarsRequest} from '@/dtos/request/activityHistory/historyDetail/DetailStackedBarsRequest.ts'
import type {DetailPieChartRequest} from '@/dtos/request/activityHistory/historyDetail/DetailPieChartRequest.ts'
import type {DetailSummaryCardsRequest} from '@/dtos/request/activityHistory/historyDetail/DetailSummaryCardsRequest.ts'
import {HistoryStackedBarsResponse} from '@/dtos/response/historyDashboard/HistoryStackedBarsResponse.ts'
import {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
import {HistorySummaryCardsResponse} from '@/dtos/response/historyDashboard/HistorySummaryCardsResponse.ts'
import {CalendarActivityDaySummary} from '@/dtos/response/historyDashboard/CalendarActivityDaySummary.ts'
import type {CalendarActivityRequest} from '@/dtos/request/activityHistory/CalendarActivityRequest.ts';
import type {HistorySummaryStackedBarsRequest} from '@/dtos/request/activityHistory/historySummary/HistorySummaryStackedBarsRequest.ts';
import type {HistorySummaryPieChartRequest} from '@/dtos/request/activityHistory/historySummary/HistorySummaryPieChartRequest.ts';
import type {HistorySummarySummaryCardsRequest} from '@/dtos/request/activityHistory/historySummary/HistorySummarySummaryCardsRequest.ts';

const SUMMARY_URL = '/activity-history/dashboard/summary'
const DETAIL_URL = '/activity-history/dashboard/detail'

// --- Summary (multi-day, ActivityDateRangeRequest based) ---

export async function getSummaryStackedBars(
	request: HistorySummaryStackedBarsRequest
): Promise<HistoryStackedBarsResponse> {
	const {data} = await API.post(`${SUMMARY_URL}/stacked-bars`, request)
	return HistoryStackedBarsResponse.fromJson(data)
}

export async function getSummaryPieChart(
	request: HistorySummaryPieChartRequest
): Promise<HistoryPieChartResponse> {
	const {data} = await API.post(`${SUMMARY_URL}/pie-chart`, request)
	return HistoryPieChartResponse.fromJson(data)
}

export async function getSummarySummaryCards(
	request: HistorySummarySummaryCardsRequest
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
