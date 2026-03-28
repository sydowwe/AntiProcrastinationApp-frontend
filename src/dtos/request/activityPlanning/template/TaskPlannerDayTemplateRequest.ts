import type {DayType} from '@/dtos/enum/DayType.ts';
import type {DayOfWeek} from '@/dtos/enum/DayOfWeek.ts';
import {Time} from '@/dtos/dto/Time.ts';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import type {Location} from '@/dtos/enum/Location.ts';

export class TaskPlannerDayTemplateRequest {
	constructor(
		public name: string = '',
		public description: string | null = null,
		public icon: string | null = null,
		public isActive: boolean = true,
		public defaultWakeUpTime: Time = new Time(7, 0),
		public defaultBedTime: Time = new Time(23, 0),
		public suggestedForDayType?: DayType,
		public tags: string[] = [],
		public scheduledDays: DayOfWeek[] = [],
		public suggestedLocation?: Location,
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
			entity.tags,
			entity.scheduledDays ?? [],
			entity.suggestedLocation,
		)
	}
}