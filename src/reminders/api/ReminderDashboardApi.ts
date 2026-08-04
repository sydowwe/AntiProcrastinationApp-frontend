import { API } from '@/_common/axiosConfig.ts'
import { useRequestState } from '@/_common/api/useRequestState.ts'
import { BaseTableResponse } from '@/_common/dto/response/base/BaseTableResponse.ts'
import { filenameFromContentDisposition } from '@/_common/utils/fileDownload.ts'
import type { ExportFormat } from '@/_common/dto/ExportFormat.ts'
import type { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { UpcomingReminderGridResponse } from '@/core/reminders/dto/response/UpcomingReminderGridResponse.ts'
import { DispatchHistoryGridResponse } from '@/core/reminders/dto/response/DispatchHistoryGridResponse.ts'
import { ReminderOverviewResponse } from '@/core/reminders/dto/response/ReminderOverviewResponse.ts'
import type { UpcomingReminderFilter } from '@/core/reminders/dto/request/UpcomingReminderFilter.ts'
import type { MyReminderFilter } from '@/core/reminders/dto/request/MyReminderFilter.ts'
import type { DispatchHistoryFilter } from '@/core/reminders/dto/request/DispatchHistoryFilter.ts'
import type { DismissOccurrenceRequest } from '@/core/reminders/dto/request/DismissOccurrenceRequest.ts'
import type { SnoozeOccurrenceRequest } from '@/core/reminders/dto/request/SnoozeOccurrenceRequest.ts'

const BASE = '/reminder-dashboard'

interface ItemFromJson<T> {
	fromJson(json: any): T
}

/**
 * A filter+sort+paginate query against one of the dashboard's POST endpoints. These don't follow the
 * generic `/{entity}/filtered-table` convention, so we POST to the explicit path here. The latest request
 * aborts any in-flight one so rapid filter edits don't race.
 */
function useFilteredTableQuery<T extends IIdResponse, TFilter>(path: string, responseClass: ItemFromJson<T>) {
	const { loading, run } = useRequestState()
	let controller: AbortController | null = null

	function fetchFilteredTable(request: FilteredTableRequest<TFilter>): Promise<{ items: T[]; itemsCount: number }> {
		controller?.abort()
		controller = new AbortController()
		const signal = controller.signal
		return run(async () => {
			const response = await API.post(path, request, { signal })
			const parsed = BaseTableResponse.fromJson(response.data ?? {}, (r: any) => responseClass.fromJson(r))
			return { items: parsed.items, itemsCount: parsed.itemsCount }
		}, `Failed to fetch ${path}`)
	}

	return { loading, fetchFilteredTable }
}

async function exportFiltered<TFilter>(
	path: string,
	request: FilteredTableRequest<TFilter>,
	format: ExportFormat,
	fallbackName: string,
): Promise<{ blob: Blob; fileName: string }> {
	const response = await API.post(path, request, {
		params: { format },
		responseType: 'blob',
	})
	const fileName = filenameFromContentDisposition(
		response.headers['content-disposition'],
		`${fallbackName}.${format}`,
	)
	return { blob: response.data, fileName }
}

// ----- Admin: browse upcoming (all areas) -----

export function useUpcomingReminderQuery() {
	return useFilteredTableQuery<UpcomingReminderGridResponse, UpcomingReminderFilter>(
		`${BASE}/upcoming`,
		UpcomingReminderGridResponse,
	)
}

export function exportUpcomingReminders(request: FilteredTableRequest<UpcomingReminderFilter>, format: ExportFormat) {
	return exportFiltered(`${BASE}/upcoming/export`, request, format, 'pripomienky-nadchadzajuce')
}

// ----- Personal: my upcoming (always self-scoped server-side) -----

export function useMyReminderQuery() {
	return useFilteredTableQuery<UpcomingReminderGridResponse, MyReminderFilter>(
		`${BASE}/my-upcoming`,
		UpcomingReminderGridResponse,
	)
}

// ----- Admin: dispatch (send) history -----

export function useDispatchHistoryQuery() {
	return useFilteredTableQuery<DispatchHistoryGridResponse, DispatchHistoryFilter>(
		`${BASE}/dispatch-history`,
		DispatchHistoryGridResponse,
	)
}

export function exportDispatchHistory(request: FilteredTableRequest<DispatchHistoryFilter>, format: ExportFormat) {
	return exportFiltered(`${BASE}/dispatch-history/export`, request, format, 'pripomienky-historia')
}

// ----- Admin: overview -----

export async function fetchReminderOverview(): Promise<ReminderOverviewResponse> {
	const response = await API.get(`${BASE}/overview`)
	return ReminderOverviewResponse.fromJson(response.data)
}

// ----- Personal: per-occurrence actions -----

/**
 * Suppress the caller's delivery of one upcoming occurrence. 404 = not your reminder (or it doesn't exist
 * / is strategy-resolved); 400 = the occurrence is in the past. Returns no content on success.
 */
export async function dismissOccurrence(request: DismissOccurrenceRequest): Promise<void> {
	await API.post(`${BASE}/dismiss`, request, { _silent: true })
}

/**
 * Defer the caller's delivery of one upcoming occurrence to `snoozeUntil`. 404 = not your reminder; 400 =
 * the occurrence or snooze-until is in the past. Returns no content on success.
 */
export async function snoozeOccurrence(request: SnoozeOccurrenceRequest): Promise<void> {
	await API.post(`${BASE}/snooze`, request, { _silent: true })
}
