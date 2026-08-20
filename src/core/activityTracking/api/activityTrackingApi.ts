import { API } from '@/_common/axiosConfig.ts'
import { ActivityWindow } from '@/core/activityTracking/dto/response/stackedBars/ActivityWindow.ts'
import { TimelineResponse } from '@/core/activityTracking/dto/response/timeline/TimelineResponse.ts'
import { DomainDetailsResponse } from '@/core/activityTracking/dto/response/DomainDetailsResponse'
import type { SummaryCardsRequest } from '@/core/activityTracking/dto/request/SummaryCardsRequest.ts'
import { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
import type { PieChartRequest } from '@/core/activityTracking/dto/request/PieChartRequest.ts'
import { PieChartData } from '@/core/activityTracking/dto/response/pieChart/PieChartData.ts'
import type { StackedBarsRequest } from '@/core/activityTracking/dto/request/StackedBarsRequest.ts'
import type { TimelineRequest } from '@/core/activityTracking/dto/request/TimelineRequest.ts'
import type { FocusMetricsRequest } from '@/core/activityTracking/dto/request/FocusMetricsRequest.ts'
import { FocusMetricsResponse } from '@/core/activityTracking/dto/response/focusMetrics/FocusMetricsResponse.ts'

const BASE_URL = '/activity-tracking/web-extension'

export async function getSummaryCards(request: SummaryCardsRequest, signal?: AbortSignal): Promise<SummaryCardsData[]> {
	const { data } = await API.post(`${BASE_URL}/summary-cards`, request, { signal, _silent: true })
	return data.map((d: any) => SummaryCardsData.fromJson(d))
}

export async function getPieChart(request: PieChartRequest, signal?: AbortSignal): Promise<PieChartData> {
	const { data } = await API.post(`${BASE_URL}/pie-chart`, request, { signal, _silent: true })
	return PieChartData.fromJson(data)
}

export async function getStackedBarsData(request: StackedBarsRequest, signal?: AbortSignal): Promise<ActivityWindow[]> {
	const { data } = await API.post(`${BASE_URL}/stacked-bars`, request, { signal, _silent: true })

	return data.map((w: any) => ActivityWindow.fromJson(w))
}

export async function getTimeline(request: TimelineRequest, signal?: AbortSignal): Promise<TimelineResponse> {
	const { data } = await API.post(`${BASE_URL}/timeline`, request, { signal, _silent: true })
	return TimelineResponse.fromJson(data)
}

export async function getFocusMetrics(
	request: FocusMetricsRequest,
	signal?: AbortSignal,
): Promise<FocusMetricsResponse> {
	const { data } = await API.post(`${BASE_URL}/focus-metrics`, request, { signal, _silent: true })
	return FocusMetricsResponse.fromJson(data)
}

export async function getDomainDetails(
	date: string,
	timeFrom: string,
	timeTo: string,
	domain: string,
): Promise<DomainDetailsResponse> {
	const { data } = await API.get(`${BASE_URL}/domain-details`, {
		params: { date, timeFrom, timeTo, domain },
	})
	return DomainDetailsResponse.fromJson(data)
}
