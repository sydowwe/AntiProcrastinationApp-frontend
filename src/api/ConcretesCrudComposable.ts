import {useEntityCommand, useEntityQuery, useFetchFiltered, useFetchFilteredSorted} from '@/composables/general/CrudComposition.ts';
import {Category} from '@/dtos/response/activity/Category.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {Time} from '@/dtos/dto/Time.ts';
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import {Activity} from '@/dtos/response/activity/Activity.ts';
import {ActivityRequest} from '@/dtos/request/activity/ActivityRequest.ts';
import {Role} from '@/dtos/response/activity/Role.ts';
import {RoleRequest} from '@/dtos/request/activity/RoleRequest.ts';
import {AlarmRequest} from '@/dtos/request/activityRecording/AlarmRequest.ts';
import {Alarm} from '@/dtos/response/activityRecording/Alarm.ts';
import {TimePeriodEntity} from '@/dtos/response/activityRecording/TimePeriodEntity.ts';
import {TimePeriodRequest} from '@/dtos/request/activityRecording/TimePeriodRequest.ts';
import {TodoListItemEntity} from '@/dtos/response/todoList/TodoListItemEntity.ts';
import {ToDoListItemRequest} from '@/dtos/request/todoList/ToDoListItemRequest.ts';
import {ChangeDisplayOrderRequest} from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts';
import {TodoListEntity} from '@/dtos/response/todoList/TodoListEntity.ts';
import {TodoListRequest} from '@/dtos/request/todoList/TodoListRequest.ts';
import {TodoListCategoryEntity} from '@/dtos/response/todoList/TodoListCategoryEntity.ts';
import {TodoListCategoryRequest} from '@/dtos/request/todoList/TodoListCategoryRequest.ts';
import {TodoListFilter} from '@/dtos/request/todoList/TodoListFilter.ts';
import {RoutineTodoListItemEntity} from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts';
import {RoutineTodoListItemRequest} from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts';
import {RoutineTodoListGroupedList} from '@/dtos/response/todoList/RoutineTodoListGroupedList.ts';
import {ActivityHistoryRequest} from '@/dtos/request/activityHistory/ActivityHistoryRequest.ts';
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts';
import {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts';
import type {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts';
import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';
import type {CalendarFilter} from '@/dtos/request/activityPlanning/CalendarFilter.ts';
import type {PlannerTaskFilter} from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts';
import {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';
import {TimerPreset} from '@/dtos/response/activityRecording/TimerPreset.ts';
import {TimerPresetRequest} from '@/dtos/request/activityRecording/TimerPresetRequest.ts';
import {PomodoroTimerPreset} from '@/dtos/response/activityRecording/PomodoroTimerPreset.ts';
import {PomodoroTimerPresetRequest} from '@/dtos/request/activityRecording/PomodoroTimerPresetRequest.ts';
import {FilterSortRequest} from '@/dtos/request/base/FilterSortRequest.ts';
import {SortByRequest} from '@/dtos/request/base/SortByRequest.ts';
import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';

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

export function useTodoListCrud() {
	const url = 'todo-list'
	const {fetchById} = useEntityQuery<TodoListEntity>({responseClass: TodoListEntity, entityName: url})
	const {createWithResponse, update, deleteEntity} = useEntityCommand<TodoListEntity, TodoListRequest, TodoListRequest>({
		responseClass: TodoListEntity,
		createRequestClass: TodoListRequest,
		updateRequestClass: TodoListRequest,
		entityName: url
	})

	const {fetchFilteredSorted: baseFetchFilteredSorted} = useFetchFilteredSorted<TodoListEntity, TodoListFilter>(TodoListEntity, url)
	const fetchFilteredSorted = async (isDesc: boolean, categoryId: number | null, name: string | null) =>
		baseFetchFilteredSorted(new FilterSortRequest(true, [new SortByRequest('name', isDesc)], new TodoListFilter(categoryId, name)))

	return {fetchById, createWithResponse, update, deleteEntity, fetchFilteredSorted}
}

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

export function useTodoListItemCrud(namedListId: number) {
	const url = 'todo-list-item';
	const {fetchById, fetchSelectOptions} = useEntityQuery<TodoListItemEntity>({responseClass: TodoListItemEntity, entityName: url})
	const {
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

	async function fetchAll(): Promise<TodoListItemEntity[]> {
		const response = await API.get(url, {params: {namedListId}})
		return response.data.map((item: any) => TodoListItemEntity.fromJson(item))
	}

	async function createWithResponse(entityData: ToDoListItemRequest): Promise<TodoListItemEntity> {
		const createResponse = await API.post(url, {...entityData, namedListId})
		return fetchById(createResponse.data)
	}

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

export function usePomodoroTimerPresetCrud() {
	const url = 'pomodoro-timer-preset';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<PomodoroTimerPreset>({responseClass: PomodoroTimerPreset, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<PomodoroTimerPreset, PomodoroTimerPresetRequest, PomodoroTimerPresetRequest>({
		responseClass: PomodoroTimerPreset,
		createRequestClass: PomodoroTimerPresetRequest,
		updateRequestClass: PomodoroTimerPresetRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity}
}