import { API } from '@/_common/axiosConfig.ts'
import { UnifiedSourceBreakdown } from '@/core/activityTracking/dto/response/unified/UnifiedSourceBreakdown.ts'
import { UnifiedSummaryItem } from '@/core/activityTracking/dto/response/unified/UnifiedSummaryItem.ts'
import { UnifiedPieChartResponse } from '@/core/activityTracking/dto/response/unified/UnifiedPieChartResponse.ts'
import { UnifiedStackedBarsWindow } from '@/core/activityTracking/dto/response/unified/UnifiedStackedBarsWindow.ts'
import { UnifiedTimelineResponse } from '@/core/activityTracking/dto/response/unified/UnifiedTimelineResponse.ts'
import { FocusMetricsResponse } from '@/core/activityTracking/dto/response/focusMetrics/FocusMetricsResponse.ts'
import type { UnifiedActivityRequest } from '@/core/activityTracking/dto/request/unified/UnifiedActivityRequest.ts'
import type { UnifiedSummaryCardsRequest } from '@/core/activityTracking/dto/request/unified/UnifiedSummaryCardsRequest.ts'
import type { UnifiedPieChartRequest } from '@/core/activityTracking/dto/request/unified/UnifiedPieChartRequest.ts'
import type { UnifiedStackedBarsRequest } from '@/core/activityTracking/dto/request/unified/UnifiedStackedBarsRequest.ts'
import type { UnifiedTimelineRequest } from '@/core/activityTracking/dto/request/unified/UnifiedTimelineRequest.ts'
import type { UnifiedFocusMetricsRequest } from '@/core/activityTracking/dto/request/unified/UnifiedFocusMetricsRequest.ts'

/**
 * The merged dashboard. One route family rather than a fourth per-source one — the source is a request
 * field here, which is the shape `U3-backend.md` §6 proposed for all of them and the one this view
 * needs regardless, since the overlap resolution depends on the selected set.
 *
 * Every request is `_silent`: failures surface as the failing panel's own retry state, never as a
 * snackbar, exactly as on the three per-source dashboards.
 */
const BASE_URL = '/activity-tracking/unified'

/**
 * Drives the source filter *and* the overlap note, so it is fetched on every round alongside the four
 * panels rather than once at mount: `hasData` and `displacedSeconds` are both properties of the
 * selected span, and the displacement figures change whenever the selected source set does.
 */
export async function getUnifiedSourceBreakdown(
	request: UnifiedActivityRequest,
	signal?: AbortSignal,
): Promise<UnifiedSourceBreakdown[]> {
	const { data } = await API.post(`${BASE_URL}/sources`, request, { signal, _silent: true })
	return UnifiedSourceBreakdown.listFromObjects(data)
}

export async function getUnifiedSummaryCards(
	request: UnifiedSummaryCardsRequest,
	signal?: AbortSignal,
): Promise<UnifiedSummaryItem[]> {
	const { data } = await API.post(`${BASE_URL}/summary-cards`, request, { signal, _silent: true })
	return UnifiedSummaryItem.listFromObjects(data)
}

export async function getUnifiedPieChart(
	request: UnifiedPieChartRequest,
	signal?: AbortSignal,
): Promise<UnifiedPieChartResponse> {
	const { data } = await API.post(`${BASE_URL}/pie-chart`, request, { signal, _silent: true })
	return UnifiedPieChartResponse.fromJson(data)
}

export async function getUnifiedStackedBars(
	request: UnifiedStackedBarsRequest,
	signal?: AbortSignal,
): Promise<UnifiedStackedBarsWindow[]> {
	const { data } = await API.post(`${BASE_URL}/stacked-bars`, request, { signal, _silent: true })
	return UnifiedStackedBarsWindow.listFromObjects(data)
}

export async function getUnifiedTimeline(
	request: UnifiedTimelineRequest,
	signal?: AbortSignal,
): Promise<UnifiedTimelineResponse> {
	const { data } = await API.post(`${BASE_URL}/timeline`, request, { signal, _silent: true })
	return UnifiedTimelineResponse.fromJson(data)
}

export async function getUnifiedFocusMetrics(
	request: UnifiedFocusMetricsRequest,
	signal?: AbortSignal,
): Promise<FocusMetricsResponse> {
	const { data } = await API.post(`${BASE_URL}/focus-metrics`, request, { signal, _silent: true })
	return FocusMetricsResponse.fromJson(data)
}
