import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
import { TaskPlannerDayTemplateRequest } from '@/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts'
import { TemplateSuggestionResponse } from '@/core/dayPlanner/dto/response/template/TemplateSuggestionResponse.ts'
import { API } from '@/_common/axiosConfig.ts'

export function useTaskPlannerDayTemplateTaskCrud() {
	const url = 'task-planner-day-template'
	const { fetchById, fetchByField, fetchAll, fetchSelectOptions } = useEntityQuery<TaskPlannerDayTemplate>({
		responseClass: TaskPlannerDayTemplate,
		entityName: url,
	})
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<
		TaskPlannerDayTemplate,
		TaskPlannerDayTemplateRequest,
		TaskPlannerDayTemplateRequest
	>({
		responseClass: TaskPlannerDayTemplate,
		createRequestClass: TaskPlannerDayTemplateRequest,
		updateRequestClass: TaskPlannerDayTemplateRequest,
		entityName: url,
	})

	async function fetchByName(name: string): Promise<TaskPlannerDayTemplate> {
		return await fetchByField('name', name)
	}

	/**
	 * Sets (never toggles) the pinned flag, so two devices pinning the same template converge.
	 * `isPinned` is deliberately absent from the create/update request body, so an edit submitted
	 * from a form opened before the pin cannot silently unpin.
	 */
	async function setPinned(id: number, isPinned: boolean): Promise<void> {
		await API.patch(`${url}/${id}/pinned`, { isPinned })
	}

	/**
	 * The route takes the calendar id in the path; the server reads the date and day type off the calendar.
	 * It used to send `?date=` to `/suggestions`, which fell through to the generic `GET /{id}` and 400'd,
	 * the same mistake `repeatingPlannerTaskApi.fetchSuggestionsForCalendar` documents for its twin.
	 * Silent: suggestions are an optional extra, and the picker degrades to no suggestions on a failure.
	 */
	async function fetchSuggestions(calendarId: number): Promise<TemplateSuggestionResponse[]> {
		const response = await API.get(`${url}/suggestions/${calendarId}`, { _silent: true })
		return TemplateSuggestionResponse.listFromObjects(response.data)
	}

	return {
		fetchById,
		fetchByName,
		fetchAll,
		fetchSelectOptions,
		createWithResponse,
		create,
		update,
		deleteEntity,
		setPinned,
		fetchSuggestions,
	}
}
