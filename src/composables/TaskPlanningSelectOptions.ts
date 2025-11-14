import {useEntityQuery} from '@/composables/general/CrudComposition.ts';
import {Role} from '@/classes/Role.ts';
import {Category} from '@/classes/Category.ts';
import {Activity} from '@/classes/Activity.ts';
import {TaskPriority} from '@/classes/TaskPriority.ts';
import {TimePeriodEntity} from '@/classes/ToDoListItem.ts';

export function useTaskPlanningSelectOptions() {
	const {fetchSelectOptions: fetchTaskUrgencySelectOptions} = useEntityQuery<TaskPriority>({responseClass: TaskPriority, entityName: 'task-urgency'})
	const {fetchSelectOptions: fetchTimePeriodEntitySelectOptions} = useEntityQuery<TimePeriodEntity>({responseClass: TimePeriodEntity, entityName: 'routine-time-period'})


	return {
		fetchTaskUrgencySelectOptions,
		fetchTimePeriodEntitySelectOptions,
	}
}