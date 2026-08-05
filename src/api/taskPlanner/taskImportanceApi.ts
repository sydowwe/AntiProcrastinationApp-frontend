import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TaskImportance } from '@/dtos/response/activityPlanning/TaskImportance.ts'

export function useTaskImportanceCrud() {
	const url = 'task-importance'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<TaskImportance>({
		responseClass: TaskImportance,
		entityName: url,
	})
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<TaskImportance, any, any>({
		responseClass: TaskImportance,
		entityName: url,
	})

	return { fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity }
}
