import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
import { ActivityProjectProfileRequest } from '@/core/leisure/dto/request/ActivityProjectProfileRequest.ts'
import type { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'

export function useActivityProjectProfileCrud() {
	const url = 'activity-project-profile'
	const { fetchById, fetchAll } = useEntityQuery<ActivityProjectProfile>({
		responseClass: ActivityProjectProfile,
		entityName: url,
	})
	const { create, createWithResponse, update, deleteEntity, batchDelete } = useEntityCommand<
		ActivityProjectProfile,
		ActivityProjectProfileRequest,
		ActivityProjectProfileRequest
	>({
		responseClass: ActivityProjectProfile,
		createRequestClass: ActivityProjectProfileRequest,
		updateRequestClass: ActivityProjectProfileRequest,
		entityName: url,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<ActivityProjectProfile, ActivityProjectProfileFilter>({
		responseClass: ActivityProjectProfile,
		entityName: url,
	})

	/**
	 * FO13: remembers which to-do item the shopping handoff created, so ticking it off moves the project to
	 * Ready to start (the server's `ProjectShoppingDoneEventHandler`). `_silent` and never rejecting: the item
	 * already exists by the time this runs, and a failed link only means the user moves the card by hand, as
	 * before — not worth an error over a to-do that was created fine.
	 */
	async function linkShoppingItem(id: number, todoListItemId: number): Promise<boolean> {
		try {
			await API.patch(`/${url}/${id}/shopping-item`, { todoListItemId }, { _silent: true })
			return true
		} catch {
			return false
		}
	}

	return {
		fetchById,
		fetchAll,
		create,
		createWithResponse,
		update,
		deleteEntity,
		batchDelete,
		fetchFilteredTable,
		linkShoppingItem,
	}
}
