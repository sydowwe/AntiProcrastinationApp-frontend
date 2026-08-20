import { API } from '@/_common/axiosConfig.ts'
import type { DetailStackedBarsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailStackedBarsRequest.ts'
import type { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
import type { DetailSummaryCardsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailSummaryCardsRequest.ts'
import { HistoryStackedBarsResponse } from '@/core/historyDashboard/dto/response/HistoryStackedBarsResponse.ts'
import { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
import { HistorySummaryCardsResponse } from '@/core/historyDashboard/dto/response/HistorySummaryCardsResponse.ts'
import { CalendarActivityDaySummary } from '@/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts'
import type { CalendarActivityRequest } from '@/core/activityHistory/dto/request/CalendarActivityRequest.ts'
import type { DetailTimelineRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailTimelineRequest.ts'
import { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
import type { HistorySummaryStackedBarsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryStackedBarsRequest.ts'
import type { HistorySummaryPieChartRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryPieChartRequest.ts'
import type { HistorySummarySummaryCardsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummarySummaryCardsRequest.ts'

const SUMMARY_URL = '/activity-history/dashboard/summary'
const DETAIL_URL = '/activity-history/dashboard/detail'

// --- Summary (multi-day, ActivityDateRangeRequest based) ---

export async function getSummaryStackedBars(
	request: HistorySummaryStackedBarsRequest,
): Promise<HistoryStackedBarsResponse> {
	const { data } = await API.post(`${SUMMARY_URL}/stacked-bars`, request)
	return HistoryStackedBarsResponse.fromJson(data)
}

export async function getSummaryPieChart(request: HistorySummaryPieChartRequest): Promise<HistoryPieChartResponse> {
	const { data } = await API.post(`${SUMMARY_URL}/pie-chart`, request)
	return HistoryPieChartResponse.fromJson(data)
}

export async function getSummarySummaryCards(
	request: HistorySummarySummaryCardsRequest,
): Promise<HistorySummaryCardsResponse> {
	const { data } = await API.post(`${SUMMARY_URL}/summary-cards`, request)
	return HistorySummaryCardsResponse.fromJson(data)
}

// --- Detail (single-day, DateAndTimeRangeRequest based) ---

export async function getDetailStackedBars(request: DetailStackedBarsRequest): Promise<HistoryStackedBarsResponse> {
	const { data } = await API.post(`${DETAIL_URL}/stacked-bars`, request)
	return HistoryStackedBarsResponse.fromJson(data)
}

export async function getDetailPieChart(request: DetailPieChartRequest): Promise<HistoryPieChartResponse> {
	const { data } = await API.post(`${DETAIL_URL}/pie-chart`, request)
	return HistoryPieChartResponse.fromJson(data)
}

export async function getDetailSummaryCards(request: DetailSummaryCardsRequest): Promise<HistorySummaryCardsResponse> {
	const { data } = await API.post(`${DETAIL_URL}/summary-cards`, request)
	return HistorySummaryCardsResponse.fromJson(data)
}

// --- Calendar Activity Summary (per-day activity breakdown for calendar view) ---

export async function getCalendarActivitySummary(
	request: CalendarActivityRequest,
): Promise<CalendarActivityDaySummary[]> {
	const { data } = await API.post('/activity-history/dashboard/calendar', request)
	return data.map((d: any) => CalendarActivityDaySummary.fromJson(d))
}

// --- Timeline (single-day activity history list) ---

export async function getDetailTimeline(request: DetailTimelineRequest): Promise<ActivityHistory[]> {
	const { data } = await API.post('/activity-history/filter', request)
	return ActivityHistory.listFromObjects(data)
}
