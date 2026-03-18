import {useEntityQuery} from '@/api/base/useEntityQuery.ts';
import {useEntityCommand} from '@/api/base/useEntityCommand.ts';
import {useFetchFilteredSorted} from '@/api/base/useFetchFilteredSorted.ts';
import {TodoListCategoryEntity} from '@/dtos/response/todoList/TodoListCategoryEntity.ts';
import {TodoListCategoryRequest} from '@/dtos/request/todoList/TodoListCategoryRequest.ts';
import {FilterSortRequest} from '@/dtos/request/base/FilterSortRequest.ts';
import {SortByRequest} from '@/dtos/request/base/SortByRequest.ts';
import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';

export function useTodoListCategoryCrud() {
	const url = 'todo-list-category'
	const {fetchById, fetchSelectOptions} = useEntityQuery<TodoListCategoryEntity>({responseClass: TodoListCategoryEntity, entityName: url})
	const {createWithResponse, update, deleteEntity} = useEntityCommand<TodoListCategoryEntity, TodoListCategoryRequest, TodoListCategoryRequest>({
		responseClass: TodoListCategoryEntity,
		createRequestClass: TodoListCategoryRequest,
		updateRequestClass: TodoListCategoryRequest,
		entityName: url
	})
	const {fetchFilteredSorted: baseFetchFilteredSorted} = useFetchFilteredSorted<TodoListCategoryEntity, IFilterRequest>(TodoListCategoryEntity, url)
	const fetchFilteredSorted = async (isDesc: boolean, name: string | null) =>
		baseFetchFilteredSorted(new FilterSortRequest(true, [new SortByRequest('name', isDesc)], {name} as IFilterRequest))

	return {fetchById, fetchSelectOptions, fetchFilteredSorted, createWithResponse, update, deleteEntity}
}
