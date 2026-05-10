import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'
import { RepeatingPlannerTaskRequest } from '@/dtos/request/activityPlanning/RepeatingPlannerTaskRequest.ts'
import { API } from '@/plugins/axiosConfig.ts'

export function useRepeatingPlannerTaskApi() {
	const url = 'repeating-planner-task'
	const { fetchById, fetchAll } = useEntityQuery<RepeatingPlannerTask>({
		responseClass: RepeatingPlannerTask,
		entityName: url,
	})
	const { createWithResponse, update, deleteEntity } = useEntityCommand<
		RepeatingPlannerTask,
		RepeatingPlannerTaskRequest,
		RepeatingPlannerTaskRequest
	>({
		responseClass: RepeatingPlannerTask,
		createRequestClass: RepeatingPlannerTaskRequest,
		updateRequestClass: RepeatingPlannerTaskRequest,
		entityName: url,
	})

	async function fetchSuggestionsForDate(date: string): Promise<RepeatingPlannerTask[]> {
		const response = await API.get(`${url}/suggestions`, { params: { date } })
		return RepeatingPlannerTask.listFromObjects(response.data)
	}

	return {
		fetchById,
		fetchAll,
		fetchSuggestionsForDate,
		createWithResponse,
		update,
		deleteEntity,
	}
}
