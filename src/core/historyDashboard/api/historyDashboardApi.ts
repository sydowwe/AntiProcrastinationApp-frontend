import { API } from '@/_common/axiosConfig.ts'
import type { DetailStackedBarsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailStackedBarsRequest.ts'
import type { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
import type { DetailSummaryCardsRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailSummaryCardsRequest.ts'
import { HistoryStackedBarsResponse } from '@/core/historyDashboard/dto/response/HistoryStackedBarsResponse.ts'
import { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
import { HistorySummaryCardsResponse } from '@/core/historyDashboard/dto/response/HistorySummaryCardsResponse.ts'
import { HistoryTimeOfDayResponse } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayResponse.ts'
import type { HistorySummaryTimeOfDayRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryTimeOfDayRequest.ts'
import { CalendarActivityDaySummary } from '@/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts'
import type { CalendarActivityRequest } from '@/core/activityHistory/dto/request/CalendarActivityRequest.ts'
import type { DetailTimelineRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailTimelineRequest.ts'
import { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
import type { HistorySummaryStackedBarsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryStackedBarsRequest.ts'
import type { HistorySummaryPieChartRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummaryPieChartRequest.ts'
import { HistorySummarySummaryCardsRequest } from '@/core/historyDashboard/dto/request/historySummary/HistorySummarySummaryCardsRequest.ts'
import { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
import { HistoryGroupBy } from '@/core/historyDashboard/dto/enum/HistoryGroupBy.ts'
import { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

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

export async function getSummaryTimeOfDay(request: HistorySummaryTimeOfDayRequest): Promise<HistoryTimeOfDayResponse> {
	const { data } = await API.post(`${SUMMARY_URL}/time-of-day`, request)
	return HistoryTimeOfDayResponse.fromJson(data)
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

// --- First-run detection (H7) ---

/**
 * Whether the user has ever recorded anything, anywhere — the cheapest existence check available
 * without a dedicated endpoint. Fired only when the current period's own fetch comes back empty
 * (see `useHistoryDashboard.ts`), never on the common path. `groupBy`/`topN` are irrelevant to the
 * yes/no answer, so they're fixed to the cheapest values.
 */
export async function getHasAnyHistoryEver(): Promise<boolean> {
	const request = new HistorySummarySummaryCardsRequest(
		'2000-01-01',
		ActivityDateRangeTypeEnum.CustomRange,
		HistoryGroupBy.Activity,
		BaselineType.AllTime,
		1,
		formatDateForApi(new Date()),
	)
	const response = await getSummarySummaryCards(request)
	return response.cards.length > 0
}
