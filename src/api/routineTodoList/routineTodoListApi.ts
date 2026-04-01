import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
import { RoutineTodoListItemEntity } from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts'
import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
import { RoutineTodoListGroupedList } from '@/dtos/response/todoList/RoutineTodoListGroupedList.ts'
import type { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
import { API } from '@/plugins/axiosConfig.ts'

export function useRoutineTodoListItemCrud() {
	const { showErrorSnackbar } = useSnackbar()

	const url = '/routine-todo-list'

	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<RoutineTodoListItemEntity>({
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
				`Error changing urgency of to-do list item ${request.movedItemId} between ${request.precedingItemId} and ${request.followingItemId}`,
				e,
			)
			return Promise.reject(e)
		}
	}

	return {
		fetchById,
		fetchAll,
		fetchSelectOptions,
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity,
		getAllGrouped,
		changeDisplayOrder,
	}
}
