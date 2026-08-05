import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TaskPriority } from '@/dtos/response/todoList/TaskPriority.ts'

export function useTaskPriorityCrud() {
	const url = 'task-priority'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<TaskPriority>({
		responseClass: TaskPriority,
		entityName: url,
	})
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<TaskPriority, any, any>({
		responseClass: TaskPriority,
		entityName: url,
	})

	return { fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity }
}
