import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
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

	// The framework's `patch` targets `/{entity}/{id}` only; this endpoint is a sub-resource patch.
	async function patchStatus(id: number, request: PatchPlannerTaskStatusRequest): Promise<void> {
		await API.patch(`/${url}/${id}/status`, request)
	}

	const { fetchFiltered } = useFetchFiltered<PlannerTask, PlannerTaskFilter>({
		responseClass: PlannerTask,
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
		batchedToggleIsDone,
		patchStatus,
		deleteEntity,
		batchDelete,
	}
}
