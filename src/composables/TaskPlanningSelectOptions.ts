import {useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {TimePeriodEntity} from '@/dtos/response/TimePeriodEntity.ts';

export function useTaskPlanningSelectOptions() {
	const {fetchSelectOptions: fetchTaskUrgencySelectOptions} = useEntityQuery<TaskPriority>({responseClass: TaskPriority, entityName: 'task-priority'})
	const {fetchSelectOptions: fetchTimePeriodEntitySelectOptions} = useEntityQuery<TimePeriodEntity>({
		responseClass: TimePeriodEntity,
		entityName: 'routine-time-period'
	})


	return {
		fetchTaskUrgencySelectOptions,
		fetchTimePeriodEntitySelectOptions,
	}
}