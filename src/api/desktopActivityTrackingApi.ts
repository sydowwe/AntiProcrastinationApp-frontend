import {API} from '@/plugins/axiosConfig'
import {DesktopStackedBarsWindow} from '@/dtos/response/activityTracking/desktop/DesktopStackedBarsWindow.ts'
import {DesktopTimelineResponse} from '@/dtos/response/activityTracking/desktop/DesktopTimelineResponse.ts'
import {DesktopProcessSummaryDto} from '@/dtos/response/activityTracking/desktop/DesktopProcessSummaryDto.ts'
import {DesktopPieChartResponse} from '@/dtos/response/activityTracking/desktop/DesktopPieChartResponse.ts'
import {DesktopProcessDetailsResponse} from '@/dtos/response/activityTracking/desktop/DesktopProcessDetailsResponse.ts'
import type {DesktopStackedBarsRequest} from '@/dtos/request/activityTracking/desktop/DesktopStackedBarsRequest.ts'
import type {DesktopTimelineRequest} from '@/dtos/request/activityTracking/desktop/DesktopTimelineRequest.ts'
import type {DesktopSummaryCardsRequest} from '@/dtos/request/activityTracking/desktop/DesktopSummaryCardsRequest.ts'
import type {DesktopPieChartRequest} from '@/dtos/request/activityTracking/desktop/DesktopPieChartRequest.ts'

const BASE_URL = '/activity-tracking/desktop'

export async function getDesktopStackedBars(request: DesktopStackedBarsRequest): Promise<DesktopStackedBarsWindow[]> {
	const {data} = await API.post(`${BASE_URL}/stacked-bars`, request)
	return data.map((w: any) => DesktopStackedBarsWindow.fromJson(w))
}

export async function getDesktopTimeline(request: DesktopTimelineRequest): Promise<DesktopTimelineResponse> {
	const {data} = await API.post(`${BASE_URL}/timeline`, request)
	return DesktopTimelineResponse.fromJson(data)
}

export async function getDesktopSummaryCards(request: DesktopSummaryCardsRequest): Promise<DesktopProcessSummaryDto[]> {
	const {data} = await API.post(`${BASE_URL}/summary-cards`, request)
	return data.map((d: any) => DesktopProcessSummaryDto.fromJson(d))
}

export async function getDesktopPieChart(request: DesktopPieChartRequest): Promise<DesktopPieChartResponse> {
	const {data} = await API.post(`${BASE_URL}/pie-chart`, request)
	return DesktopPieChartResponse.fromJson(data)
}

export async function getDesktopProcessDetails(
	processName: string,
	from: string,
	to: string
): Promise<DesktopProcessDetailsResponse> {
	const {data} = await API.get(`${BASE_URL}/process-details`, {
		params: {processName, from, to}
	})
	return DesktopProcessDetailsResponse.fromJson(data)
}
