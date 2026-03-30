import type { DayType } from '@/dtos/enum/DayType.ts'
import type { DayOfWeek } from '@/dtos/enum/DayOfWeek.ts'
import type { Time } from '@/dtos/dto/Time.ts'
import type { Location } from '@/dtos/enum/Location.ts'

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
		public scheduledDays: DayOfWeek[] = [],
		public lastUsedAt?: string,
		public suggestedLocation?: Location,
	) {}

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
			json.scheduledDays ?? [],
			json.lastUsedAt,
			json.suggestedLocation ?? undefined,
		)
	}
}
