import {useEntityCommand, useEntityQuery, useFetchFiltered} from '@/composables/general/CrudComposition.ts';
import {Category} from '@/dtos/response/Category.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {Time} from '@/utils/Time.ts';
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import {Activity} from '@/dtos/response/Activity.ts';
import {ActivityRequest} from '@/dtos/request/ActivityRequest.ts';
import {Role} from '@/dtos/response/Role.ts';
import {RoleRequest} from '@/dtos/request/RoleRequest.ts';
import {AlarmRequest} from '@/dtos/request/AlarmRequest.ts';
import {Alarm} from '@/dtos/response/Alarm.ts';
import {TimePeriodEntity} from '@/dtos/response/TimePeriodEntity.ts';
import {TimePeriodRequest} from '@/dtos/request/TimePeriodRequest.ts';
import {TodoListItemEntity} from '@/dtos/response/TodoListItemEntity.ts';
import {ToDoListItemRequest} from '@/dtos/request/ToDoListItemRequest.ts';
import {ChangeDisplayOrderRequest} from '@/dtos/request/ChangeDisplayOrderRequest.ts';
import {RoutineTodoListItemEntity} from '@/dtos/response/RoutineTodoListItemEntity.ts';
import {RoutineTodoListItemRequest} from '@/dtos/request/RoutineTodoListItemRequest.ts';
import {RoutineTodoListGroupedList} from '@/dtos/response/RoutineTodoListGroupedList.ts';
import {ActivityHistoryRequest} from '@/dtos/request/ActivityHistoryRequest.ts';
import {ActivityHistory} from '@/dtos/response/ActivityHistory.ts';
import {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts';
import type {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts';
import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';
import type {CalendarFilter} from '@/dtos/request/activityPlanning/CalendarFilter.ts';
import type {PlannerTaskFilter} from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts';
import {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';
import {TimerPreset} from '@/dtos/response/TimerPreset.ts';
import {TimerPresetRequest} from '@/dtos/request/TimerPresetRequest.ts';

export function useActivityHistoryCrud() {
	const url = 'activity-history'
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
		entityName: url
	})

	async function create(startTimestamp: Date, length?: Time, activityId?: number) {
		const request = new ActivityHistoryRequest(startTimestamp, length ?? Time.fromMinutes(0), activityId ?? -1);
		return baseCreate(request)
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityCrud() {
	const url = 'activity'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Activity>({responseClass: Activity, entityName: url})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Activity, ActivityRequest, ActivityRequest>({
		responseClass: Activity,
		createRequestClass: ActivityRequest,
		updateRequestClass: ActivityRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityRoleCrud() {
	const url = 'activity-role'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Role>({responseClass: Role, entityName: url})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Role, RoleRequest, RoleRequest>({
		responseClass: Role,
		createRequestClass: RoleRequest,
		updateRequestClass: RoleRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useActivityCategoryCrud() {
	const url = 'activity-category'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Category>({responseClass: Category, entityName: url})
	const {createWithResponse, create, update, deleteEntity} = useEntityCommand<Category, any, any>({
		responseClass: Category,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useTaskPriorityCrud() {
	const url = 'task-priority'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TaskPriority>({responseClass: TaskPriority, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<TaskPriority, any, any>({
		responseClass: TaskPriority,
		entityName: url
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
			await API.patch(url + `/toggle-is-hidden`, {ids: [id]})
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


	async function changeDisplayOrder(request: ChangeDisplayOrderRequest) {
		try {
			await API.patch(url + `/change-display-order`, request)
			return Promise.resolve();
		} catch (e: any) {
			console.error(`Error changing urgency of to-do list item ${request.movedItemId} between ${request.precedingItemId} and ${request.followingItemId}`, e)
			return Promise.reject(e)
		}
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity, changeUrgency, changeDisplayOrder}
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

	async function changeDisplayOrder(request: ChangeDisplayOrderRequest) {
		try {
			await API.patch(url + `/change-display-order`, request)
			return Promise.resolve();
		} catch (e: any) {
			console.error(`Error changing urgency of to-do list item ${request.movedItemId} between ${request.precedingItemId} and ${request.followingItemId}`, e)
			return Promise.reject(e)
		}
	}

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity, getAllGrouped, changeDisplayOrder}
}

export function useTaskPlannerCrud() {
	const url = 'planner-task'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<PlannerTask>({responseClass: PlannerTask, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		patch,
		batchedToggle,
		deleteEntity,
		batchDelete
	} = useEntityCommand<PlannerTask, any, any>({
		responseClass: PlannerTask,
		entityName: url
	})

	async function batchedToggleIsDone(ids: number[]): Promise<void> {
		return await batchedToggle('is-done', ids)
	}

	const {fetchFiltered} = useFetchFiltered<PlannerTask, PlannerTaskFilter>(
		PlannerTask,
		url
	)
	return {fetchById, fetchAll, fetchFiltered, fetchSelectOptions, createWithResponse, create, update, patch, batchedToggleIsDone, deleteEntity, batchDelete}
}

export function useTaskImportanceCrud() {
	const url = 'task-importance'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TaskImportance>({responseClass: TaskImportance, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<TaskImportance, any, any>({
		responseClass: TaskImportance,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useTemplatePlannerTaskCrud() {
	const url = 'template-planner-task'
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TemplatePlannerTask>({
		responseClass: TemplatePlannerTask,
		entityName: url
	})
	const {
		createWithResponse,
		create,
		update,
		patch,
		deleteEntity,
		batchDelete
	} = useEntityCommand<TemplatePlannerTask, TemplatePlannerTaskRequest, TemplatePlannerTaskRequest>({
		responseClass: TemplatePlannerTask,
		createRequestClass: TemplatePlannerTaskRequest,
		updateRequestClass: TemplatePlannerTaskRequest,
		entityName: url
	})

	const {fetchFiltered} = useFetchFiltered<TemplatePlannerTask, TemplatePlannerTaskFilter>(
		TemplatePlannerTask,
		url
	)

	return {fetchById, fetchAll, fetchFiltered, fetchSelectOptions, createWithResponse, create, update, patch, deleteEntity, batchDelete}
}

export function useTaskPlannerDayTemplateTaskCrud() {
	const url = 'task-planner-day-template'
	const {fetchById, fetchByField, fetchAll, fetchSelectOptions} = useEntityQuery<TaskPlannerDayTemplate>({
		responseClass: TaskPlannerDayTemplate,
		entityName: url
	})
	const {
		createWithResponse,
		create,
		update,
		deleteEntity
	} = useEntityCommand<TaskPlannerDayTemplate, TaskPlannerDayTemplateRequest, TaskPlannerDayTemplateRequest>({
		responseClass: TaskPlannerDayTemplate,
		createRequestClass: TaskPlannerDayTemplateRequest,
		updateRequestClass: TaskPlannerDayTemplateRequest,
		entityName: url
	})

	async function fetchByName(name: string): Promise<TaskPlannerDayTemplate> {
		return await fetchByField('name', name)
	}

	return {fetchById, fetchByName, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity}
}

export function useCalendarQuery() {
	const url = 'calendar';
	const {fetchById, fetchByField} = useEntityQuery<Calendar>({responseClass: Calendar, entityName: url})
	const {updateWithResponse} = useEntityCommand<Calendar, any, any>({
		responseClass: Calendar,
		entityName: url
	})

	const {fetchFiltered} = useFetchFiltered<Calendar, CalendarFilter>(
		Calendar,
		url
	)

	//Format 'dd.MM.yyyy'
	function fetchByDate(date: string): Promise<Calendar> {
		return fetchByField('date', date)
	}

	return {fetchFiltered, fetchById, fetchByDate, updateWithResponse}
}

export function useAlarmCrud() {
	const url = 'alarm';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Alarm>({responseClass: Alarm, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<Alarm, AlarmRequest, AlarmRequest>({
		responseClass: Alarm,
		createRequestClass: AlarmRequest,
		updateRequestClass: AlarmRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity}
}

export function useTimerPresetCrud() {
	const url = 'timer-preset';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<TimerPreset>({responseClass: TimerPreset, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<TimerPreset, TimerPresetRequest, TimerPresetRequest>({
		responseClass: TimerPreset,
		createRequestClass: TimerPresetRequest,
		updateRequestClass: TimerPresetRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity}
}