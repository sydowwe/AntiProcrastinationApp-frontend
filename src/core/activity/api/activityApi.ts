import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Activity } from '@/core/activity/dto/response/Activity.ts'
import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'

export function useActivityCrud() {
	const url = 'activity'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<Activity>({
		responseClass: Activity,
		entityName: url,
	})
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<
		Activity,
		ActivityRequest,
		ActivityRequest
	>({
		responseClass: Activity,
		createRequestClass: ActivityRequest,
		updateRequestClass: ActivityRequest,
		entityName: url,
	})

	return { fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity }
}
