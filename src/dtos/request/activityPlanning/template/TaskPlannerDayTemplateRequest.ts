import type {DayType} from '@/dtos/enum/DayType.ts';
import {Time} from '@/dtos/dto/Time.ts';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';

export class TaskPlannerDayTemplateRequest {
	constructor(
		public name: string = '',
		public description: string | null = null,
		public icon: string | null = null,
		public isActive: boolean = true,
		public defaultWakeUpTime: Time = new Time(7, 0),
		public defaultBedTime: Time = new Time(23, 0),
		public suggestedForDayType?: DayType,
		public tags: string[] = []
	) {
	}

	static fromEntity(entity: TaskPlannerDayTemplate) {
		return new TaskPlannerDayTemplateRequest(
			entity.name,
			entity.description,
			entity.icon,
			entity.isActive,
			entity.defaultWakeUpTime,
			entity.defaultBedTime,
			entity.suggestedForDayType,
			entity.tags
		)
	}
}