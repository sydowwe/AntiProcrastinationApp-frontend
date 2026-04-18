import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
import { ToDoListItemRequest } from '@/dtos/request/todoList/ToDoListItemRequest.ts'
import type { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
import { API } from '@/plugins/axiosConfig.ts'

export async function fetchTodoListItems(todoListId?: number | null): Promise<TodoListItemEntity[]> {
	const response = await API.get('todo-list-item', { params: todoListId != null ? { todoListId } : {} })
	return response.data.map((item: any) => TodoListItemEntity.fromJson(item))
}

export function useTodoListItemCrud(todoListId: number) {
	const url = 'todo-list-item'
	const { fetchById, fetchSelectOptions } = useEntityQuery<TodoListItemEntity>({
		responseClass: TodoListItemEntity,
		entityName: url,
	})
	const { create, update, updateWithResponse, deleteEntity } = useEntityCommand<
		TodoListItemEntity,
		ToDoListItemRequest,
		ToDoListItemRequest
	>({
		responseClass: TodoListItemEntity,
		createRequestClass: ToDoListItemRequest,
		updateRequestClass: ToDoListItemRequest,
		entityName: url,
	})

	async function fetchAll(): Promise<TodoListItemEntity[]> {
		const response = await API.get(url, { params: { todoListId } })
		return response.data.map((item: any) => TodoListItemEntity.fromJson(item))
	}

	async function createWithResponse(entityData: ToDoListItemRequest): Promise<TodoListItemEntity> {
		const createResponse = await API.post(url, { ...entityData, todoListId })
		return fetchById(createResponse.data)
	}

	async function changeUrgency(id: number, urgencyId: number) {
		try {
			await API.patch(url + `/change-urgency/${id}/${urgencyId}`)
			return Promise.resolve()
		} catch (e: any) {
			console.error(`Error changing urgency of to-do list item ${id} to urgencyId ${urgencyId}`, e)
			return Promise.reject(e)
		}
	}

	async function changeDisplayOrder(request: ChangeDisplayOrderRequest) {
		try {
			await API.patch(url + `/change-display-order`, request)
			return Promise.resolve()
		} catch (e: any) {
			console.error(
				`Error changing display order of to-do list item ${request.movedItemId} between ${request.precedingItemId} and ${request.followingItemId}`,
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
		changeUrgency,
		changeDisplayOrder,
	}
}
