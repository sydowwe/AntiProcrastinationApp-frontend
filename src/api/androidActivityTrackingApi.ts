import { API } from '@/plugins/axiosConfig'
import { AndroidStackedBarsWindow } from '@/dtos/response/activityTracking/android/AndroidStackedBarsWindow.ts'
import { AndroidTimelineResponse } from '@/dtos/response/activityTracking/android/AndroidTimelineResponse.ts'
import { AndroidAppSummaryDto } from '@/dtos/response/activityTracking/android/AndroidAppSummaryDto.ts'
import { AndroidPieChartResponse } from '@/dtos/response/activityTracking/android/AndroidPieChartResponse.ts'
import type { AndroidStackedBarsRequest } from '@/dtos/request/activityTracking/android/dashboard/AndroidStackedBarsRequest.ts'
import type { AndroidTimelineRequest } from '@/dtos/request/activityTracking/android/dashboard/AndroidTimelineRequest.ts'
import type { AndroidSummaryCardsRequest } from '@/dtos/request/activityTracking/android/dashboard/AndroidSummaryCardsRequest.ts'
import type { AndroidPieChartRequest } from '@/dtos/request/activityTracking/android/dashboard/AndroidPieChartRequest.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
import { TrackerAndroidMappingResponse } from '@/dtos/response/activityTracking/android/settings/TrackerAndroidMappingResponse.ts'
import { TrackerAndroidMappingRequest } from '@/dtos/request/activityTracking/android/settings/TrackerAndroidMappingRequest.ts'
import type { AndroidDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/android/settings/AndroidDistinctEntriesFilterRequest.ts'

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
	>(TrackerAndroidMappingResponse, url)
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
