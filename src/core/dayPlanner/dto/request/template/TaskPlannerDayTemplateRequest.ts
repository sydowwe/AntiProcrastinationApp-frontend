import type { DayType } from '@/_common/dto/enum/DayType.ts'
import type { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
import type { Location } from '@/core/dayPlanner/dto/enum/Location.ts'

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
	) {}

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
