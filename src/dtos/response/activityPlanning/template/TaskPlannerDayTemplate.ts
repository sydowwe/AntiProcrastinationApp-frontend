import type {DayType} from '@/dtos/enum/DayType.ts';

export class TaskPlannerDayTemplateResponse {
	constructor(
		public id: string,
		public name: string,
		public isActive: boolean,
		public usageCount: number,
		public suggestedForDayType: DayType,
		public tags: string[],
		public description?: string,
		public icon?: string,
		public defaultWakeUpTime?: string,
		public defaultBedTime?: string,
		public lastUsedAt?: string
	) {
	}

	static fromJson(json: any): TaskPlannerDayTemplateResponse {
		return new TaskPlannerDayTemplateResponse(
			json.id,
			json.name,
			json.isActive,
			json.usageCount,
			json.suggestedForDayType,
			json.tags,
			json.description,
			json.icon,
			json.defaultWakeUpTime,
			json.defaultBedTime,
			json.lastUsedAt
		);
	}
}

