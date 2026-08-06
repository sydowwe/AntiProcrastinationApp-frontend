import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredSorted } from '@/_common/api/useFetchFilteredSorted.ts'
import { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'
import { TodoListRequest } from '@/core/todoList/dto/request/TodoListRequest.ts'
import { TodoListFilter } from '@/core/todoList/dto/request/TodoListFilter.ts'
import { FilterSortRequest } from '@/_common/dto/request/base/FilterSortRequest.ts'
import { SortByRequest } from '@/_common/dto/request/base/SortByRequest.ts'

export function useTodoListCrud() {
	const url = 'todo-list'
	const { fetchById, fetchSelectOptions } = useEntityQuery<TodoListEntity>({
		responseClass: TodoListEntity,
		entityName: url,
	})
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

	const { fetchFilteredSorted: baseFetchFilteredSorted } = useFetchFilteredSorted<TodoListEntity, TodoListFilter>({
		responseClass: TodoListEntity,
		entityName: url,
	})
	const fetchFilteredSorted = async (isDesc: boolean, categoryId: number | null, name: string | null) =>
		baseFetchFilteredSorted(
			new FilterSortRequest(true, [new SortByRequest('name', isDesc)], new TodoListFilter(categoryId, name)),
		)

	return { fetchById, fetchSelectOptions, createWithResponse, update, deleteEntity, fetchFilteredSorted }
}
