import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Activity } from '@/core/activity/dto/response/Activity.ts'
import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
import type { QuickEditActivityRequest } from '@/core/activity/dto/request/QuickEditActivityRequest.ts'
import type { MergeActivitiesRequest } from '@/core/activity/dto/request/MergeActivitiesRequest.ts'
import { MergeActivitiesResult } from '@/core/activity/dto/response/MergeActivitiesResult.ts'
import type { QuickEditMode } from '@/core/activity/dto/enum/QuickEditMode.ts'
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
		mode: QuickEditMode,
		request: QuickEditActivityRequest,
	): Promise<number | null> {
		return API.patch(`/${url}/${activityId}/${mode}`, request).then(response =>
			response.data != null ? Number(response.data) : null,
		)
	}

	/**
	 * Archive or restore, idempotently — sending `true` for an already-archived activity is a no-op, not
	 * an error, so a double click on the row action cannot fail.
	 *
	 * Archiving is what the module offers instead of deleting a referenced activity: the history stays,
	 * the pickers lose the row. Which is why this invalidates the option cache like any other mutation —
	 * the picker lists and the combination matrix are exactly what changed.
	 */
	function setArchived(activityId: number, isArchived: boolean): Promise<void> {
		return API.patch(`/${url}/${activityId}/archived`, { isArchived }).then(() => undefined)
	}

	/**
	 * Fold several activities into one. Irreversible, and it moves rows in four other modules, so it is
	 * the one mutation whose confirmation ignores the user's `askBeforeDelete` preference (see
	 * `MergeActivitiesDialog.vue`).
	 *
	 * `invalidatingActivityOptions('activity', …)` covers everything the cache holds about activities:
	 * the plain list *and*, through `MATRIX_KINDS`, the per-source combination matrix. Roles and
	 * categories are untouched by a merge — no role or category is created or removed by one — so their
	 * two lists are deliberately left alone.
	 */
	function merge(request: MergeActivitiesRequest): Promise<MergeActivitiesResult> {
		return API.post(`/${url}/merge`, request).then(response => MergeActivitiesResult.fromJson(response.data))
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
		setArchived: invalidatingActivityOptions('activity', setArchived),
		merge: invalidatingActivityOptions('activity', merge),
	}
}
