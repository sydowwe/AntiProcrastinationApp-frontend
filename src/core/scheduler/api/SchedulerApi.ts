import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { createRequestState } from '@/_common/api/useRequestState.ts'
import { filenameFromContentDisposition } from '@/_common/utils/fileDownload.ts'
import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
import type { ScheduledJobFilter } from '@/core/scheduler/dto/request/ScheduledJobFilter.ts'
import type { ScheduledJobRunFilter } from '@/core/scheduler/dto/request/ScheduledJobRunFilter.ts'
import { ScheduledJobGridResponse } from '@/core/scheduler/dto/response/ScheduledJobGridResponse.ts'
import { ScheduledJobResponse } from '@/core/scheduler/dto/response/ScheduledJobResponse.ts'
import { ScheduledJobRunGridResponse } from '@/core/scheduler/dto/response/ScheduledJobRunGridResponse.ts'
import { ScheduledJobRunResponse } from '@/core/scheduler/dto/response/ScheduledJobRunResponse.ts'
import { SchedulerNeedsAttentionResponse } from '@/core/scheduler/dto/response/SchedulerNeedsAttentionResponse.ts'
import type { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'

const JOB_ENTITY = 'scheduled-job'
const RUN_ENTITY = 'scheduled-job-run'

// ----- Jobs -----

export function useScheduledJobQuery() {
	const sharedState = createRequestState()
	const { fetchFilteredTable } = useFetchFilteredTable<ScheduledJobGridResponse, ScheduledJobFilter>({
		responseClass: ScheduledJobGridResponse,
		entityName: JOB_ENTITY,
		sharedState,
	})
	const query = useEntityQuery<ScheduledJobResponse>({
		entityName: JOB_ENTITY,
		responseClass: ScheduledJobResponse,
		sharedState,
	})
	return { ...query, fetchFilteredTable }
}

/** Exports the registered-jobs list reflecting the given filter. Deliberately omits job payload data. */
export async function exportScheduledJobs(
	request: FilteredTableRequest<ScheduledJobFilter>,
	format: ExportFormat,
): Promise<{ blob: Blob; fileName: string }> {
	const response = await API.post(`/${JOB_ENTITY}/export`, request, {
		params: { format },
		responseType: 'blob',
	})
	const fileName = filenameFromContentDisposition(response.headers['content-disposition'], `planovac-ulohy.${format}`)
	return { blob: response.data, fileName }
}

/** Health summary for the "needs attention" view. */
export async function fetchSchedulerNeedsAttention(): Promise<SchedulerNeedsAttentionResponse> {
	const response = await API.get(`/${JOB_ENTITY}/needs-attention`)
	return SchedulerNeedsAttentionResponse.fromJson(response.data)
}

// ----- Job operator actions -----

/** Runs the job once immediately, off its schedule (works even when paused). Records a manual run. */
export async function triggerJobNow(id: number): Promise<void> {
	await API.post(`/${JOB_ENTITY}/${id}/trigger`)
}

/** Stops the job from firing on its schedule until resumed. */
export async function pauseJob(id: number): Promise<void> {
	await API.post(`/${JOB_ENTITY}/${id}/pause`)
}

/** Re-enables a paused job; its next-run time is recomputed server-side. */
export async function resumeJob(id: number): Promise<void> {
	await API.post(`/${JOB_ENTITY}/${id}/resume`)
}

// ----- Runs -----

export function useScheduledJobRunQuery() {
	const sharedState = createRequestState()
	const { fetchFilteredTable } = useFetchFilteredTable<ScheduledJobRunGridResponse, ScheduledJobRunFilter>({
		responseClass: ScheduledJobRunGridResponse,
		entityName: RUN_ENTITY,
		sharedState,
	})
	const query = useEntityQuery<ScheduledJobRunResponse>({
		entityName: RUN_ENTITY,
		responseClass: ScheduledJobRunResponse,
		sharedState,
	})
	return { ...query, fetchFilteredTable }
}

/** Exports a job's run history reflecting the given filter. Deliberately omits payload data. */
export async function exportScheduledJobRuns(
	request: FilteredTableRequest<ScheduledJobRunFilter>,
	format: ExportFormat,
): Promise<{ blob: Blob; fileName: string }> {
	const response = await API.post(`/${RUN_ENTITY}/export`, request, {
		params: { format },
		responseType: 'blob',
	})
	const fileName = filenameFromContentDisposition(response.headers['content-disposition'], `planovac-behy.${format}`)
	return { blob: response.data, fileName }
}

/**
 * Re-runs a specific past execution using the exact payload it originally ran with. Produces a NEW run
 * linked back to the original; the original run is never changed. Replays repeat the job's real side
 * effects — confirm with the operator before calling this. Returns the new run id.
 */
export async function replayRun(runId: number): Promise<number> {
	const response = await API.post(`/${RUN_ENTITY}/${runId}/replay`)
	return response.data?.id ?? response.data
}
