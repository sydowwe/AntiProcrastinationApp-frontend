import {useEntityQuery} from '@/api/base/useEntityQuery.ts';
import {useEntityCommand} from '@/api/base/useEntityCommand.ts';
import {Time} from '@/dtos/dto/Time.ts';
import {ActivityHistoryRequest} from '@/dtos/request/activityHistory/ActivityHistoryRequest.ts';
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts';

export function useActivityHistoryCrud() {
	const url = 'activity-history'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<ActivityHistory>({responseClass: ActivityHistory, entityName: 'activity'})
	const {
		createWithResponse,
		create: baseCreate,
		update,
		deleteEntity
	} = useEntityCommand<ActivityHistory, ActivityHistoryRequest, ActivityHistoryRequest>({
		responseClass: ActivityHistory,
		createRequestClass: ActivityHistoryRequest,
		updateRequestClass: ActivityHistoryRequest,
		entityName: url
	})

	async function create(startTimestamp: Date, length?: Time, activityId?: number) {
		const request = new ActivityHistoryRequest(startTimestamp, length ?? Time.fromMinutes(0), activityId ?? -1);
		return baseCreate(request)
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}
