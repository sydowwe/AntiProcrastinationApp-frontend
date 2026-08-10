import { API } from '@/_common/axiosConfig.ts'
import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFiltered } from '@/_common/api/useFetchFiltered.ts'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import type { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'

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

	// Shared by every "start tracking this task" entry point (the planner's own controller and the
	// home now-bar), so the InProgress patch has exactly one definition. See migration-revision.md §8.
	async function markInProgress(id: number, actualStartTime: Time): Promise<void> {
		await patchStatus(id, new PatchPlannerTaskStatusRequest(PlannerTaskStatus.InProgress, actualStartTime))
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
		markInProgress,
		deleteEntity,
		batchDelete,
	}
}
