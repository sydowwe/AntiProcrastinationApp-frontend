import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { API } from '@/_common/axiosConfig.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityHistoryRequest } from '@/core/activityHistory/dto/request/ActivityHistoryRequest.ts'
import type { ActivityHistorySessionRequest } from '@/core/activityHistory/dto/request/ActivityHistorySessionRequest.ts'
import { ActivityHistory } from '@/core/activityHistory/dto/response/ActivityHistory.ts'
import { ActivityLoggedTimeAggregate } from '@/core/activityHistory/dto/response/ActivityLoggedTimeAggregate.ts'

export function useActivityHistoryCrud() {
	const url = 'activity-history'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<ActivityHistory>({
		responseClass: ActivityHistory,
		entityName: 'activity',
	})
	const {
		createWithResponse,
		create: baseCreate,
		update,
		deleteEntity,
	} = useEntityCommand<ActivityHistory, ActivityHistoryRequest, ActivityHistoryRequest>({
		responseClass: ActivityHistory,
		createRequestClass: ActivityHistoryRequest,
		updateRequestClass: ActivityHistoryRequest,
		entityName: url,
	})

	async function create(startTimestamp: Date, length?: Time, activityId?: number) {
		const request = new ActivityHistoryRequest(startTimestamp, length ?? Time.fromMinutes(0), activityId ?? -1)
		return baseCreate(request)
	}

	return { fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity }
}

/**
 * Writes a finished timer session and all its rows in one transaction — every row lands or none does.
 * Returns null on any failure. `_silent`: the caller shows one snackbar for the whole session, naming
 * the activity, and the interceptor's generic one would be a second.
 */
export async function createActivityHistorySession(
	request: ActivityHistorySessionRequest,
): Promise<{ sessionId: number; recordIds: number[] } | null> {
	try {
		const { data } = await API.post('/activity-history/session', request, { _silent: true })
		return { sessionId: data.sessionId, recordIds: data.recordIds ?? [] }
	} catch {
		return null
	}
}

/**
 * Total logged time and entry count per activity, keyed by activity id — used for estimate-vs-actual
 * calibration (`prompts/todo-motivation/S3-estimate-vs-actual.md`). `_silent`: this is decoration for a
 * list the user opened to see their tasks, not a request the user made — a failure should leave the
 * calibration chips off, not throw an error toast.
 */
export async function fetchActivityLoggedTimeAggregate(activityIds: number[]): Promise<ActivityLoggedTimeAggregate[]> {
	if (activityIds.length === 0) return []
	const { data } = await API.post('/activity-history/aggregate-by-activity', { activityIds }, { _silent: true })
	return ActivityLoggedTimeAggregate.listFromObjects(data)
}
