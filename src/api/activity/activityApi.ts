import {useEntityQuery} from '@/api/base/useEntityQuery.ts';
import {useEntityCommand} from '@/api/base/useEntityCommand.ts';
import {Activity} from '@/dtos/response/activity/Activity.ts';
import {ActivityRequest} from '@/dtos/request/activity/ActivityRequest.ts';

export function useActivityCrud() {
	const url = 'activity'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Activity>({responseClass: Activity, entityName: url})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Activity, ActivityRequest, ActivityRequest>({
		responseClass: Activity,
		createRequestClass: ActivityRequest,
		updateRequestClass: ActivityRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}
