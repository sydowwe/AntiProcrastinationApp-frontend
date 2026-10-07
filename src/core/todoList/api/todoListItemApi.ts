import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
import type { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
import { API } from '@/_common/axiosConfig.ts'
import type { AxiosRequestConfig } from 'axios'
import { DailyRecap } from '@/core/todoList/dto/response/DailyRecap.ts'
import { RescheduleOverdueResult } from '@/core/todoList/dto/response/RescheduleOverdueResult.ts'

/**
 * `todoListId` is required, and deliberately not optional: the backend rejects the unfiltered call with a 400
 * rather than serving every item the user owns in one unpaged read (PERF-1). A caller that wants several
 * lists asks for each of them — see `PlannerActivitySourcePicker.loadTodoEntriesFor`.
 */
export async function fetchTodoListItems(todoListId: number): Promise<TodoListItemEntity[]> {
	const response = await API.get('todo-list-item', { params: { todoListId } })
	return response.data.map((item: any) => TodoListItemEntity.fromJson(item))
}

export async function fetchDashboardTodoListItems(): Promise<TodoListItemEntity[]> {
	const response = await API.get('todo-list-item/dashboard-widget')
	return TodoListItemEntity.listFromObjects(response.data)
}

/**
 * The items completed on `isoDate`, bounded by the server in the user's zone (B2), each with its paired
 * reward and whether that reward has been taken. `_silent` plus the catch: the recap card and the
 * waiting rewards are decoration, so a failure leaves them off rather than raising a toast. `null`
 * means the read failed, never "nothing completed" — that is an empty `items`.
 */
export async function fetchDailyRecap(isoDate: string): Promise<DailyRecap | null> {
	try {
		const { data } = await API.get('todo-list-item/daily-recap', {
			// Takes the `YYYY-MM-DD` calendar day already resolved by the caller, rather than a `Date`:
			// "which day's recap" is an instant question and must be answered in the user's zone, and
			// a `Date` parameter here invites `formatDateForApi(new Date())`, which answers it in the browser's.
			params: { date: isoDate },
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

	async function createWithResponse(
		entityData: ToDoListItemRequest,
		requestConfig?: AxiosRequestConfig,
	): Promise<TodoListItemEntity> {
		const createResponse = await API.post(url, { ...entityData, todoListId }, requestConfig)
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

	/**
	 * `PATCH /{id}/move` with the destination in the body. A destination the caller cannot see is a 404 —
	 * the server's IDOR guard, so another account's list id stays unconfirmable. A destination that already
	 * holds an item on the same activity is a 409 `DbUniqueViolationError` (the `(UserId, ActivityId,
	 * TodoListId)` unique index) — `MoveToListForm` words that one inline, so it calls this `_silent`.
	 */
	async function moveToList(id: number, destinationListId: number, config?: AxiosRequestConfig) {
		try {
			await API.patch(`${url}/${id}/move`, { destinationListId }, config)
			return Promise.resolve()
		} catch (e: any) {
			console.error(`Error moving todo list item ${id} to list ${destinationListId}`, e)
			return Promise.reject(e)
		}
	}

	/**
	 * Moves every open item of this list whose due date has passed to the user's today plus `days`, in one
	 * request (FO3). The server picks the items on the user's own date and records each move as a
	 * postponement — the per-item PUT loop this replaced could half-fail and decided "overdue" on the
	 * browser's clock.
	 */
	async function rescheduleOverdue(days: number): Promise<RescheduleOverdueResult> {
		const { data } = await API.post(`${url}/reschedule-overdue`, { listId: todoListId, days })
		return RescheduleOverdueResult.fromJson(data)
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
		rescheduleOverdue,
	}
}
