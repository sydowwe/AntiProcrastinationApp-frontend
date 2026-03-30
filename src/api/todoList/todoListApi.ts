import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFilteredSorted } from '@/api/base/useFetchFilteredSorted.ts'
import { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'
import { TodoListRequest } from '@/dtos/request/todoList/TodoListRequest.ts'
import { TodoListFilter } from '@/dtos/request/todoList/TodoListFilter.ts'
import { FilterSortRequest } from '@/dtos/request/base/FilterSortRequest.ts'
import { SortByRequest } from '@/dtos/request/base/SortByRequest.ts'

export function useTodoListCrud() {
	const url = 'todo-list'
	const { fetchById } = useEntityQuery<TodoListEntity>({ responseClass: TodoListEntity, entityName: url })
	const { createWithResponse, update, deleteEntity } = useEntityCommand<
		TodoListEntity,
		TodoListRequest,
		TodoListRequest
	>({
		responseClass: TodoListEntity,
		createRequestClass: TodoListRequest,
		updateRequestClass: TodoListRequest,
		entityName: url,
	})

	const { fetchFilteredSorted: baseFetchFilteredSorted } = useFetchFilteredSorted<TodoListEntity, TodoListFilter>(
		TodoListEntity,
		url,
	)
	const fetchFilteredSorted = async (isDesc: boolean, categoryId: number | null, name: string | null) =>
		baseFetchFilteredSorted(
			new FilterSortRequest(true, [new SortByRequest('name', isDesc)], new TodoListFilter(categoryId, name)),
		)

	return { fetchById, createWithResponse, update, deleteEntity, fetchFilteredSorted }
}
