import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { API } from '@/_common/axiosConfig.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityHistoryRequest } from '@/core/activityHistory/dto/request/ActivityHistoryRequest.ts'
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
