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

	/**
	 * The server route is `GET /repeating-planner-task/suggestions/{calendarId}` — a calendar id in the
	 * PATH, not a date in the query string. This used to send `?date=…`, which matched no sub-route and
	 * fell through to `GET /repeating-planner-task/{id}`, where `"suggestions"` was rejected as an id:
	 * a 400 on every single day-planner load, whatever the date.
	 *
	 * It was filed as a backend ask and withdrawn once the route was read (B5) — the endpoint was always
	 * there. Keep the id in the path if this is ever touched again.
	 */
	async function fetchSuggestionsForCalendar(calendarId: number): Promise<SuggestionResponse[]> {
		const response = await API.get(`${url}/suggestions/${calendarId}`)
		return SuggestionResponse.listFromObjects(response.data)
	}

	return {
		fetchById,
		fetchAll,
		fetchSuggestionsForCalendar,
		createWithResponse,
		update,
		deleteEntity,
	}
}
