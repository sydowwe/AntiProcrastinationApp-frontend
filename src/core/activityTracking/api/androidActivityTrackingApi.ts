import { API } from '@/_common/axiosConfig.ts'
import { AndroidStackedBarsWindow } from '@/core/activityTracking/dto/response/android/AndroidStackedBarsWindow.ts'
import { AndroidTimelineResponse } from '@/core/activityTracking/dto/response/android/AndroidTimelineResponse.ts'
import { AndroidAppSummaryDto } from '@/core/activityTracking/dto/response/android/AndroidAppSummaryDto.ts'
import { AndroidPieChartResponse } from '@/core/activityTracking/dto/response/android/AndroidPieChartResponse.ts'
import type { AndroidStackedBarsRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidStackedBarsRequest.ts'
import type { AndroidTimelineRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidTimelineRequest.ts'
import type { AndroidSummaryCardsRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidSummaryCardsRequest.ts'
import type { AndroidPieChartRequest } from '@/core/activityTracking/dto/request/android/dashboard/AndroidPieChartRequest.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { TrackerAndroidMappingResponse } from '@/core/activityTracking/dto/response/android/settings/TrackerAndroidMappingResponse.ts'
import { TrackerAndroidMappingRequest } from '@/core/activityTracking/dto/request/android/settings/TrackerAndroidMappingRequest.ts'
import type { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'

const BASE_URL = '/activity-tracking/android'

export async function getAndroidStackedBars(request: AndroidStackedBarsRequest): Promise<AndroidStackedBarsWindow[]> {
	const { data } = await API.post(`${BASE_URL}/stacked-bars`, request)
	return data.map((w: any) => AndroidStackedBarsWindow.fromJson(w))
}

export async function getAndroidTimeline(request: AndroidTimelineRequest): Promise<AndroidTimelineResponse> {
	const { data } = await API.post(`${BASE_URL}/timeline`, request)
	return AndroidTimelineResponse.fromJson(data)
}

export async function getAndroidSummaryCards(request: AndroidSummaryCardsRequest): Promise<AndroidAppSummaryDto[]> {
	const { data } = await API.post(`${BASE_URL}/summary-cards`, request)
	return data.map((d: any) => AndroidAppSummaryDto.fromJson(d))
}

export async function getAndroidPieChart(request: AndroidPieChartRequest): Promise<AndroidPieChartResponse> {
	const { data } = await API.post(`${BASE_URL}/pie-chart`, request)
	return AndroidPieChartResponse.fromJson(data)
}

export function useTrackerAndroidMappingCrud() {
	const url = 'activity-tracking/android/settings/tracker-android-mapping-by-pattern'

	const { fetchFilteredTable, loading: tableLoading } = useFetchFilteredTable<
		TrackerAndroidMappingResponse,
		AndroidDistinctEntriesFilterRequest
	>({ responseClass: TrackerAndroidMappingResponse, entityName: url })
	const { create, createWithResponse, update, updateWithResponse, deleteEntity } = useEntityCommand<
		TrackerAndroidMappingResponse,
		TrackerAndroidMappingRequest,
		TrackerAndroidMappingRequest
	>({
		responseClass: TrackerAndroidMappingResponse,
		createRequestClass: TrackerAndroidMappingRequest,
		updateRequestClass: TrackerAndroidMappingRequest,
		entityName: url,
	})

	return { fetchFilteredTable, create, createWithResponse, update, updateWithResponse, deleteEntity, tableLoading }
}
