import { API } from '@/_common/axiosConfig.ts'
import { DesktopStackedBarsWindow } from '@/core/activityTracking/dto/response/desktop/DesktopStackedBarsWindow.ts'
import { DesktopTimelineResponse } from '@/core/activityTracking/dto/response/desktop/DesktopTimelineResponse.ts'
import { DesktopProcessSummaryDto } from '@/core/activityTracking/dto/response/desktop/DesktopProcessSummaryDto.ts'
import { DesktopPieChartResponse } from '@/core/activityTracking/dto/response/desktop/DesktopPieChartResponse.ts'
import { DesktopProcessDetailsResponse } from '@/core/activityTracking/dto/response/desktop/DesktopProcessDetailsResponse.ts'
import type { DesktopStackedBarsRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopStackedBarsRequest.ts'
import type { DesktopTimelineRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopTimelineRequest.ts'
import type { DesktopSummaryCardsRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopSummaryCardsRequest.ts'
import type { DesktopPieChartRequest } from '@/core/activityTracking/dto/request/desktop/dashboard/DesktopPieChartRequest.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TrackerDesktopMappingRequest } from '@/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingRequest.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { TrackerDesktopMappingResponse } from '@/core/activityTracking/dto/response/desktop/settings/TrackerDesktopMappingResponse.ts'
import type { DesktopDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'

const BASE_URL = '/activity-tracking/desktop'

export async function getDesktopStackedBars(request: DesktopStackedBarsRequest): Promise<DesktopStackedBarsWindow[]> {
	const { data } = await API.post(`${BASE_URL}/stacked-bars`, request)
	return data.map((w: any) => DesktopStackedBarsWindow.fromJson(w))
}

export async function getDesktopTimeline(request: DesktopTimelineRequest): Promise<DesktopTimelineResponse> {
	const { data } = await API.post(`${BASE_URL}/timeline`, request)
	return DesktopTimelineResponse.fromJson(data)
}

export async function getDesktopSummaryCards(request: DesktopSummaryCardsRequest): Promise<DesktopProcessSummaryDto[]> {
	const { data } = await API.post(`${BASE_URL}/summary-cards`, request)
	return data.map((d: any) => DesktopProcessSummaryDto.fromJson(d))
}

export async function getDesktopPieChart(request: DesktopPieChartRequest): Promise<DesktopPieChartResponse> {
	const { data } = await API.post(`${BASE_URL}/pie-chart`, request)
	return DesktopPieChartResponse.fromJson(data)
}

export async function getDesktopProcessDetails(
	processName: string,
	from: string,
	to: string,
): Promise<DesktopProcessDetailsResponse> {
	const { data } = await API.get(`${BASE_URL}/process-details`, {
		params: { processName, from, to },
	})
	return DesktopProcessDetailsResponse.fromJson(data)
}

export function useTrackerDesktopMappingCrud() {
	const url = 'activity-tracking/desktop/settings/tracker-desktop-mapping-by-pattern'

	const { fetchFilteredTable, loading: tableLoading } = useFetchFilteredTable<
		TrackerDesktopMappingResponse,
		DesktopDistinctEntriesFilterRequest
	>({ responseClass: TrackerDesktopMappingResponse, entityName: url })
	const { createWithResponse, create, update, updateWithResponse, deleteEntity } = useEntityCommand<
		TrackerDesktopMappingResponse,
		TrackerDesktopMappingRequest,
		TrackerDesktopMappingRequest
	>({
		responseClass: TrackerDesktopMappingResponse,
		createRequestClass: TrackerDesktopMappingRequest,
		updateRequestClass: TrackerDesktopMappingRequest,
		entityName: url,
	})

	return { fetchFilteredTable, createWithResponse, create, update, updateWithResponse, deleteEntity, tableLoading }
}
