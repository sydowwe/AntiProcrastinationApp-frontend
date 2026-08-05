import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
import { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
import type { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'

export function useTemplatePlannerTaskCrud() {
	const url = 'template-planner-task'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<TemplatePlannerTask>({
		responseClass: TemplatePlannerTask,
		entityName: url,
	})
	const { createWithResponse, create, update, patch, deleteEntity, batchDelete } = useEntityCommand<
		TemplatePlannerTask,
		TemplatePlannerTaskRequest,
		TemplatePlannerTaskRequest
	>({
		responseClass: TemplatePlannerTask,
		createRequestClass: TemplatePlannerTaskRequest,
		updateRequestClass: TemplatePlannerTaskRequest,
		entityName: url,
	})

	const { fetchFiltered } = useFetchFiltered<TemplatePlannerTask, TemplatePlannerTaskFilter>({
		responseClass: TemplatePlannerTask,
		entityName: url,
	})

	return {
		fetchById,
		fetchAll,
		fetchFiltered,
		fetchSelectOptions,
		createWithResponse,
		create,
		update,
		patch,
		deleteEntity,
		batchDelete,
	}
}
