import { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'

export class TemplateSuggestionResponse {
	constructor(
		public template: TaskPlannerDayTemplate,
		/**
		 * 0 = applied on this weekday before, 1 = applied on this day type before (both history, with an
		 * `occurrenceCount` of at least 2); 2 = the template's Scheduled days include this weekday, 3 = its
		 * Suggested-for day type is this one (both from the template's own settings, count always 0).
		 * `patternLabel` is the DayOfWeek name for 0/2 and the DayType name for 1/3 (B27).
		 * 4 = the day lies in a stretch of time away that names this template (F4-02); it ranks first, its
		 * `patternLabel` is the stretch's name as the user typed it (never a locale key), count 0.
		 */
		public patternType: 0 | 1 | 2 | 3 | 4,
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
