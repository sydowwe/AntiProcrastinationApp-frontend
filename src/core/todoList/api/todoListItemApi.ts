import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
import type { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
import { API } from '@/_common/axiosConfig.ts'
import { DailyRecap } from '@/core/todoList/dto/response/DailyRecap.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

export async function fetchTodoListItems(todoListId?: number | null): Promise<TodoListItemEntity[]> {
	const response = await API.get('todo-list-item', { params: todoListId != null ? { todoListId } : {} })
	return response.data.map((item: any) => TodoListItemEntity.fromJson(item))
}

export async function fetchDashboardTodoListItems(): Promise<TodoListItemEntity[]> {
	const response = await API.get('todo-list-item/dashboard-widget')
	return TodoListItemEntity.listFromObjects(response.data)
}

/**
 * No backend endpoint exists yet for this (see prompts/todo-motivation/backend/N4-backend.md) — `_silent`
 * plus the catch mean a 404 today just leaves the recap card unrendered, not an error toast the user did
 * not ask for.
 */
export async function fetchDailyRecap(date: Date): Promise<DailyRecap | null> {
	try {
		const { data } = await API.get('todo-list-item/daily-recap', {
			params: { date: formatDateForApi(date) },
			_silent: true,
		})
		return DailyRecap.fromJson(data)
	} catch {
		return null
	}
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

	async function moveToList(id: number, destinationListId: number) {
		try {
			await API.patch(`${url}/move/${id}/${destinationListId}`)
			return Promise.resolve()
		} catch (e: any) {
			console.error(`Error moving todo list item ${id} to list ${destinationListId}`, e)
			return Promise.reject(e)
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
		moveToList,
		toggleIsDone,
		uncheckAll,
	}
}
