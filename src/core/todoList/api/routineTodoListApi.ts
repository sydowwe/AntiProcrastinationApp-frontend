import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { RoutineTodoListItemRequest } from '@/core/todoList/dto/request/RoutineTodoListItemRequest.ts'
import type { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
import { API } from '@/_common/axiosConfig.ts'
import { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
import { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'

export function useRoutineTodoListItemCrud() {
	const { showErrorSnackbar } = useSnackbar()

	const url = 'routine-todo-list'

	const { fetchById, fetchAll } = useEntityQuery<RoutineTodoListItemEntity>({
		responseClass: RoutineTodoListItemEntity,
		entityName: url,
	})
	const { createWithResponse, create, update, updateWithResponse, deleteEntity } = useEntityCommand<
		RoutineTodoListItemEntity,
		RoutineTodoListItemRequest,
		RoutineTodoListItemRequest
	>({
		responseClass: RoutineTodoListItemEntity,
		createRequestClass: RoutineTodoListItemRequest,
		updateRequestClass: RoutineTodoListItemRequest,
		entityName: url,
	})

	async function getAllGrouped() {
		try {
			const response = await API.get(url + `/grouped-by-time-period`)
			return RoutineTodoListGroupedList.listFromObjects(response.data)
		} catch (e) {
			console.error(e)
			showErrorSnackbar('Error loading data. Please try again later.')
			return []
		}
	}

	async function changeDisplayOrder(request: ChangeDisplayOrderRequest) {
		try {
			await API.patch(url + `/change-display-order`, request)
			return Promise.resolve()
		} catch (e: any) {
			console.error(
				`Error changing display order of routine to-do list item ${request.movedItemId} between ${request.precedingItemId} and ${request.followingItemId}`,
				e,
			)
			return Promise.reject(e)
		}
	}

	async function toggleIsDone(id: number, forceValue?: boolean) {
		try {
			await API.patch(`/${url}/toggle-is-done`, { ids: [id], forceValue })
		} catch (error) {
			console.error(error)
		}
	}

	async function uncheckAll(doneIds: number[]) {
		if (doneIds.length === 0) return
		try {
			await API.patch(`/${url}/toggle-is-done`, { ids: doneIds })
			return Promise.resolve()
		} catch (error) {
			console.error(error)
			return Promise.reject(error)
		}
	}

	return {
		fetchById,
		fetchAll,
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity,
		getAllGrouped,
		changeDisplayOrder,
		toggleIsDone,
		uncheckAll,
	}
}
