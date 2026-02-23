import {useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {TimePeriodEntity} from '@/dtos/response/activityRecording/TimePeriodEntity.ts';
import {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';

export function useTaskPlanningSelectOptions() {
	const {fetchSelectOptions: fetchTaskImportanceSelectOptions} = useEntityQuery<TaskImportance>({responseClass: TaskImportance, entityName: 'task-importance'})
	const {fetchSelectOptions: fetchTimePeriodEntitySelectOptions} = useEntityQuery<TimePeriodEntity>({
		responseClass: TimePeriodEntity,
		entityName: 'routine-time-period'
	})


	return {
		fetchTaskImportanceSelectOptions,
		fetchTimePeriodEntitySelectOptions,
	}
}