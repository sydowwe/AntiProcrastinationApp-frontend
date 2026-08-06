import { API } from '@/_common/axiosConfig.ts'
import { ActivityWindow } from '@/core/activityTracking/dto/response/stackedBars/ActivityWindow.ts'
import { TimelineResponse } from '@/core/activityTracking/dto/response/timeline/TimelineResponse.ts'
import { DomainDetailsResponse } from '@/core/activityTracking/dto/response/DomainDetailsResponse'
import type { SummaryCardsRequest } from '@/core/activityTracking/dto/request/SummaryCardsRequest.ts'
import { SummaryCardsData } from '@/core/activityTracking/dto/response/topDomains/SummaryCardsData.ts'
import type { PieChartRequest } from '@/core/activityTracking/dto/request/PieChartRequest.ts'
import { PieChartData } from '@/core/activityTracking/dto/response/pieChart/PieChartData.ts'
import type { StackedBarsRequest } from '@/core/activityTracking/dto/request/StackedBarsRequest.ts'
import type { DateAndTimeRangeRequest } from '@/_common/dto/request/general/DateAndTimeRangeRequest.ts'

const BASE_URL = '/activity-tracking/web-extension'

export async function getSummaryCards(request: SummaryCardsRequest): Promise<SummaryCardsData[]> {
	const { data } = await API.post(`${BASE_URL}/summary-cards`, request)
	return data.map((d: any) => SummaryCardsData.fromJson(d))
}

export async function getPieChart(request: PieChartRequest): Promise<PieChartData> {
	const { data } = await API.post(`${BASE_URL}/pie-chart`, request)
	return PieChartData.fromJson(data)
}

export async function getStackedBarsData(request: StackedBarsRequest): Promise<ActivityWindow[]> {
	const { data } = await API.post(`${BASE_URL}/stacked-bars`, request)

	return data.map((w: any) => ActivityWindow.fromJson(w))
}

export async function getTimeline(request: DateAndTimeRangeRequest): Promise<TimelineResponse> {
	const { data } = await API.post(`${BASE_URL}/timeline`, request)
	console.log('[DEBUG] Timeline raw API response:', JSON.stringify(data, null, 2))
	const parsed = TimelineResponse.fromJson(data)
	console.log('[DEBUG] Timeline parsed:', parsed)
	return parsed
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
