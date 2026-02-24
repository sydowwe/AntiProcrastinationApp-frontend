import {API} from '@/plugins/axiosConfig'
import {ActivityWindow} from '@/dtos/response/activityTracking/stackedBars/ActivityWindow.ts'
import {TimelineResponse} from '@/dtos/response/activityTracking/timeline/TimelineResponse.ts'
import {DomainDetailsResponse} from '@/dtos/response/activityTracking/DomainDetailsResponse'
import {SummaryCardsRequest} from '@/dtos/request/activityTracking/SummaryCardsRequest.ts';
import {SummaryCardsData} from '@/dtos/response/activityTracking/topDomains/SummaryCardsData.ts';
import type {PieChartRequest} from '@/dtos/request/activityTracking/PieChartRequest.ts';
import {PieChartData} from '@/dtos/response/activityTracking/pieChart/PieChartData.ts';
import type {StackedBarsRequest} from '@/dtos/request/activityTracking/StackedBarsRequest.ts'
import type {DateAndTimeRangeRequest} from '@/dtos/request/general/DateAndTimeRangeRequest.ts';

const BASE_URL = '/activity-tracking/web-extension'

export async function getSummaryCards(
	request: SummaryCardsRequest
): Promise<SummaryCardsData[]> {
	const {data} = await API.post(`${BASE_URL}/summary-cards`, request)
	return data.map((d: any) => SummaryCardsData.fromJson(d))
}

export async function getPieChart(
	request: PieChartRequest
): Promise<PieChartData> {
	const {data} = await API.post(`${BASE_URL}/pie-chart`, request)
	return PieChartData.fromJson(data)
}


export async function getStackedBarsData(
	request: StackedBarsRequest
): Promise<ActivityWindow[]> {
	const {data} = await API.post(`${BASE_URL}/stacked-bars`, request)

	return data.map((w: any) => ActivityWindow.fromJson(w))
}

export async function getTimeline(
	request: DateAndTimeRangeRequest
): Promise<TimelineResponse> {
	const {data} = await API.post(`${BASE_URL}/timeline`, request)
	console.log('[DEBUG] Timeline raw API response:', JSON.stringify(data, null, 2))
	const parsed = TimelineResponse.fromJson(data)
	console.log('[DEBUG] Timeline parsed:', parsed)
	return parsed
}

export async function getDomainDetails(
	date: string,
	timeFrom: string,
	timeTo: string,
	domain: string
): Promise<DomainDetailsResponse> {
	const {data} = await API.get(`${BASE_URL}/domain-details`, {
		params: {date, timeFrom, timeTo, domain}
	})
	return DomainDetailsResponse.fromJson(data)
}
