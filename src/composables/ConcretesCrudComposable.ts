import {Role, RoleRequest} from '@/classes/Role.ts';
import {useEntityCommand, useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {Activity, ActivityRequest} from '@/classes/Activity.ts';
import {
	RoutineTodoListGroupedList,
	RoutineTodoListItemEntity,
	RoutineTodoListItemRequest,
	TimePeriodEntity,
	TimePeriodRequest,
	TodoListItemEntity,
	ToDoListItemRequest
} from '@/classes/ToDoListItem.ts';
import {Category, CategoryRequest} from '@/classes/Category.ts';
import {TaskUrgencyEntity, TaskUrgencyRequest} from '@/classes/TaskUrgencyEntity.ts';
import {ActivityHistory, ActivityHistoryRequest} from '@/classes/ActivityHistory.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {TimeLengthObject} from '@/classes/TimeUtils.ts';
import {PlannerTask, PlannerTaskRequest} from '@/classes/PlannerTask.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {Alarm, AlarmRequest} from '@/classes/Alarm.ts';

export function useActivityHistoryCrud() {
	const {showSnackbar, showErrorSnackbar} = useSnackbar();
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<ActivityHistory>({responseClass: ActivityHistory, entityName: 'activity'})
	const {
		createWithResponse,
		create: baseCreate,
		update,
		deleteEntity
	} = useEntityCommand<ActivityHistory, ActivityHistoryRequest, ActivityHistoryRequest>({
		responseClass: ActivityHistory,
		createRequestClass: ActivityHistoryRequest,
		updateRequestClass: ActivityHistoryRequest,
		entityName: 'activity-history'
	})


	async function create(startTimestamp: Date, length?: TimeLengthObject, activityId?: number) {
		const request = new ActivityHistoryRequest(startTimestamp, length ?? TimeLengthObject.fromMinutes(0), activityId ?? -1);
		return baseCreate(request)
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityCrud() {
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Activity>({responseClass: Activity, entityName: 'activity'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Activity, ActivityRequest, ActivityRequest>({
		responseClass: Activity,
		createRequestClass: ActivityRequest,
		updateRequestClass: ActivityRequest,
		entityName: 'activity'
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityRoleCrud() {
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Role>({responseClass: Role, entityName: 'activity-role'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Role, RoleRequest, RoleRequest>({
		responseClass: Role,
		createRequestClass: RoleRequest,
		updateRequestClass: RoleRequest,
		entityName: 'activity-role'
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityCategoryCrud() {
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Category>({responseClass: Category, entityName: 'activity-category'})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Category, CategoryRequest, CategoryRequest>({
		responseClass: Category,
		createRequestClass: CategoryRequest,
		updateRequestClass: CategoryRequest,
		entityName: 'activity-category'
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useTaskUrgencyCrud() {
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TaskUrgencyEntity>({responseClass: TaskUrgencyEntity, entityName: 'task-urgency'})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<TaskUrgencyEntity, TaskUrgencyRequest, TaskUrgencyRequest>({
		responseClass: TaskUrgencyEntity,
		createRequestClass: TaskUrgencyRequest,
		updateRequestClass: TaskUrgencyRequest,
		entityName: 'task-urgency'
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useRoutineTimePeriodCrud() {
	const url = 'routine-time-period';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TimePeriodEntity>({responseClass: TimePeriodEntity, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<TimePeriodEntity, TimePeriodRequest, TimePeriodRequest>({
		responseClass: TimePeriodEntity,
		createRequestClass: TimePeriodRequest,
		updateRequestClass: TimePeriodRequest,
		entityName: url
	})


	async function changeTimePeriodVisibility(id: number) {
		try {
			await API.patch(url + `/toggle-is-hidden`, {idList: [id]})
		} catch (e: any) {
			console.error(e)
		}
	}
	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity, changeTimePeriodVisibility}
}

export function useTodoListItemCrud() {
	const url = 'todo-list';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TodoListItemEntity>({responseClass: TodoListItemEntity, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<TodoListItemEntity, ToDoListItemRequest, ToDoListItemRequest>({
		responseClass: TodoListItemEntity,
		createRequestClass: ToDoListItemRequest,
		updateRequestClass: ToDoListItemRequest,
		entityName: url
	})

	async function changeUrgency(id: number, urgencyId: number) {
		try {
			await API.patch(url + `/change-urgency/${id}/${urgencyId}`)
			return Promise.resolve();
		} catch (e: any) {
			console.error(`Error changing urgency of to-do list item ${id} to urgencyId ${urgencyId}`, e)
			return Promise.reject(e)
		}
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity, changeUrgency}
}

export function useRoutineTodoListItemCrud() {
	const {showErrorSnackbar} = useSnackbar();

	const url = '/routine-todo-list';

	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<RoutineTodoListItemEntity>({
		responseClass: RoutineTodoListItemEntity,
		entityName: url
	})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<RoutineTodoListItemEntity, RoutineTodoListItemRequest, RoutineTodoListItemRequest>({
		responseClass: RoutineTodoListItemEntity,
		createRequestClass: RoutineTodoListItemRequest,
		updateRequestClass: RoutineTodoListItemRequest,
		entityName: url
	})

	async function getAllGrouped() {
		try {
			const response = await API.get(url + `/grouped-by-time-period`);
			return RoutineTodoListGroupedList.listFromObjects(response.data)
		} catch (e) {
			console.error(e)
			showErrorSnackbar('Error loading data. Please try again later.')
			return []
		}
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity, getAllGrouped}
}

export function useTaskPlannerCrud() {
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<PlannerTask>({responseClass: PlannerTask, entityName: 'task-planner'})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<PlannerTask, PlannerTaskRequest, PlannerTaskRequest>({
		responseClass: PlannerTask,
		createRequestClass: PlannerTaskRequest,
		updateRequestClass: PlannerTaskRequest,
		entityName: 'task-planner'
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}


export function useAlarmCrud() {
	const url = 'alarm';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Alarm>({responseClass: Alarm, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<Alarm, AlarmRequest, AlarmRequest>({
		responseClass: Alarm,
		createRequestClass: AlarmRequest,
		updateRequestClass: AlarmRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}