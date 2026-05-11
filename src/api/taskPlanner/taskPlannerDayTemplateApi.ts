import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import { TaskPlannerDayTemplateRequest } from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import { TemplateSuggestionResponse } from '@/dtos/response/activityPlanning/template/TemplateSuggestionResponse.ts'
import { API } from '@/plugins/axiosConfig.ts'

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

	async function fetchSuggestions(date: string): Promise<TemplateSuggestionResponse[]> {
		const response = await API.get(`${url}/suggestions`, { params: { date } })
		return TemplateSuggestionResponse.listFromObjects(response.data)
	}

	return { fetchById, fetchByName, fetchAll, fetchSelectOptions, createWithResponse, create, update, deleteEntity, fetchSuggestions }
}
