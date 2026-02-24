import type {DayType} from '@/dtos/enum/DayType.ts';
import type {Time} from '@/dtos/dto/Time.ts';

export class TaskPlannerDayTemplate {
	constructor(
		public id: number,
		public name: string,
		public isActive: boolean,
		public usageCount: number,
		public suggestedForDayType: DayType,
		public tags: string[],
		public description: string | null,
		public icon: string | null,
		public defaultWakeUpTime: Time,
		public defaultBedTime: Time,
		public lastUsedAt?: string
	) {
	}

	static fromJson(json: any): TaskPlannerDayTemplate {
		return new TaskPlannerDayTemplate(
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

