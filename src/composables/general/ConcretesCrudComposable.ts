import {API} from '@/plugins/axiosConfig.ts';
import {Role, RoleRequest} from '@/classes/Role.ts';
import {useEntityCommand, useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {Activity, ActivityRequest} from '@/classes/Activity.ts';
import {
	RoutineTodoListItemEntity,
	RoutineTodoListItemRequest,
	TimePeriodEntity,
	TimePeriodRequest,
	TodoListItemEntity,
	ToDoListItemRequest
} from '@/classes/ToDoListItem.ts';
import {Category, CategoryRequest} from '@/classes/Category.ts';
import {TaskUrgencyEntity, TaskUrgencyRequest} from '@/classes/TaskUrgencyEntity.ts';

export function useActivityCrud(){
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Activity>({responseClass: Activity, entityName: 'activity'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Activity, ActivityRequest, ActivityRequest>({responseClass: Activity, createRequestClass: ActivityRequest, updateRequestClass: ActivityRequest, entityName: 'activity'})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityRoleCrud(){
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Role>({responseClass: Role, entityName: 'activity-role'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Role, RoleRequest, RoleRequest>({responseClass: Role, createRequestClass: RoleRequest, updateRequestClass: RoleRequest, entityName: 'activity-role'})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityCategoryCrud(){
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Category>({responseClass: Category, entityName: 'activity-category'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Category, CategoryRequest, CategoryRequest>({responseClass: Category, createRequestClass: CategoryRequest, updateRequestClass: CategoryRequest, entityName: 'activity-category'})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useTaskUrgencyCrud(){
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TaskUrgencyEntity>({responseClass: TaskUrgencyEntity, entityName: 'task-urgency'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<TaskUrgencyEntity, TaskUrgencyRequest, TaskUrgencyRequest>({responseClass: TaskUrgencyEntity, createRequestClass: TaskUrgencyRequest, updateRequestClass: TaskUrgencyRequest, entityName: 'task-urgency'})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useRoutineTimePeriodCrud(){
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TimePeriodEntity>({responseClass: TimePeriodEntity, entityName: 'routine-time-period'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<TimePeriodEntity, TimePeriodRequest, TimePeriodRequest>({responseClass: TimePeriodEntity, createRequestClass: TimePeriodRequest, updateRequestClass: TimePeriodRequest, entityName: 'routine-time-period'})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useTodoListItemCrud(){
	const {fetchById, fetchAll,fetchSelectOptions} = useEntityQuery<TodoListItemEntity>({responseClass: TodoListItemEntity, entityName: 'todo-list'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<TodoListItemEntity, ToDoListItemRequest, ToDoListItemRequest>({responseClass: TodoListItemEntity, createRequestClass: ToDoListItemRequest, updateRequestClass: ToDoListItemRequest, entityName: 'routine-time-period'})

	return {fetchById, fetchAll,fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}
export function useRoutineTodoListItemCrud(){
	const {fetchById, fetchAll,fetchSelectOptions} = useEntityQuery<RoutineTodoListItemEntity>({responseClass: RoutineTodoListItemEntity, entityName: 'routine-todo-list'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<RoutineTodoListItemEntity, RoutineTodoListItemRequest, RoutineTodoListItemRequest>({responseClass: RoutineTodoListItemEntity, createRequestClass: RoutineTodoListItemRequest, updateRequestClass: RoutineTodoListItemRequest, entityName: 'routine-time-period'})

	return {fetchById, fetchAll,fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}