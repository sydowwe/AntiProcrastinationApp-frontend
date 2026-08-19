import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Activity } from '@/core/activity/dto/response/Activity.ts'
import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
import type { QuickEditActivityRequest } from '@/core/activity/dto/request/QuickEditActivityRequest.ts'
import { invalidatingActivityOptions, useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'

export function useActivityCrud() {
	const url = 'activity'
	const { fetchById, fetchAll } = useEntityQuery<Activity>({
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

	/**
	 * Overwrite the activity in place, or clone it into a new one. Lives here rather than inline in
	 * `quickCreateActivityComposition` so it invalidates the option cache like every other mutation —
	 * that composable carried a `//TODO needs refresh to other activities that are using this activity`
	 * for exactly this.
	 */
	function quickEdit(
		activityId: number,
		mode: 'Overwrite' | 'Clone',
		request: QuickEditActivityRequest,
	): Promise<number | null> {
		return API.patch(`/${url}/${activityId}/${mode}`, request).then(response =>
			response.data != null ? Number(response.data) : null,
		)
	}

	return {
		fetchById,
		fetchAll,
		/** Cached and shared — see `activityOptionsStore`. */
		fetchSelectOptions: () => useActivityOptionsStore().ensureOptions('activity'),
		createWithResponse: invalidatingActivityOptions('activity', createWithResponse),
		create: invalidatingActivityOptions('activity', create),
		update: invalidatingActivityOptions('activity', update),
		deleteEntity: invalidatingActivityOptions('activity', deleteEntity),
		quickEdit: invalidatingActivityOptions('activity', quickEdit),
	}
}
