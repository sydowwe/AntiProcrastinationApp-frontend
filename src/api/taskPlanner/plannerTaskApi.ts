import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFiltered } from '@/api/base/useFetchFiltered.ts'
import { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
import type { PlannerTaskFilter } from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts'
import type { PatchPlannerTaskStatusRequest } from '@/dtos/request/activityPlanning/PatchPlannerTaskStatusRequest.ts'
import type { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'

export function useTaskPlannerCrud() {
	const url = 'planner-task'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<PlannerTask>({
		responseClass: PlannerTask,
		entityName: url,
	})
	const { createWithResponse, create, update, patch, batchedToggle, deleteEntity, batchDelete } = useEntityCommand<
		PlannerTask,
		PlannerTaskRequest,
		PlannerTaskRequest
	>({
		responseClass: PlannerTask,
		entityName: url,
	})

	async function batchedToggleIsDone(ids: number[]): Promise<void> {
		return await batchedToggle('is-done', ids)
	}

	async function patchStatus(id: number, request: PatchPlannerTaskStatusRequest): Promise<void> {
		return await patch(id, request, 'status')
	}

	const { fetchFiltered } = useFetchFiltered<PlannerTask, PlannerTaskFilter>(PlannerTask, url)
	return {
		fetchById,
		fetchAll,
		fetchFiltered,
		fetchSelectOptions,
		createWithResponse,
		create,
		update,
		patch,
		batchedToggleIsDone,
		patchStatus,
		deleteEntity,
		batchDelete,
	}
}
