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
	const { fetchById } = useEntityQuery<TodoListItemEntity>({
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

	async function changePriority(id: number, priorityId: number) {
		try {
			await API.patch(url + `/change-priority/${id}/${priorityId}`)
			return Promise.resolve()
		} catch (e: any) {
			console.error(`Error changing priority of to-do list item ${id} to priorityId ${priorityId}`, e)
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

	async function toggleIsDone(id: number, forceValue?: boolean) {
		try {
			await API.patch(`/${url}/toggle-is-done`, { ids: [id], forceValue })
			return Promise.resolve()
		} catch (error) {
			console.error(error)
			return Promise.reject(error)
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
		changePriority,
		changeDisplayOrder,
		toggleIsDone,
		uncheckAll,
	}
}
