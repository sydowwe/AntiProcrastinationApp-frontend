import { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'

export class TemplateSuggestionResponse {
	constructor(
		public template: TaskPlannerDayTemplate,
		public patternType: 0 | 1,
		public patternLabel: string,
		public occurrenceCount: number,
	) {}

	static fromJson(json: any): TemplateSuggestionResponse {
		return new TemplateSuggestionResponse(
			TaskPlannerDayTemplate.fromJson(json.template),
			json.patternType,
			json.patternLabel,
			json.occurrenceCount,
		)
	}

	static listFromObjects(objects: any[]): TemplateSuggestionResponse[] {
		return objects.map(TemplateSuggestionResponse.fromJson)
	}
}
