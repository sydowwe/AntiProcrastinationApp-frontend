import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { RepeatingPlannerTask } from '@/core/dayPlanner/dto/response/RepeatingPlannerTask.ts'
import { RepeatingPlannerTaskRequest } from '@/core/dayPlanner/dto/request/RepeatingPlannerTaskRequest.ts'
import { SuggestionResponse } from '@/core/dayPlanner/dto/response/SuggestionResponse.ts'
import { API } from '@/_common/axiosConfig.ts'

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

	async function fetchSuggestionsForDate(date: string): Promise<SuggestionResponse[]> {
		const response = await API.get(`${url}/suggestions`, { params: { date } })
		return SuggestionResponse.listFromObjects(response.data)
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
