import type {DayType} from '@/classes/enum/activityPlanningEnum.ts';

export class TaskPlannerDayTemplateRequest {
	constructor(
		public name?: string,
		public description: string | null = null,
		public icon: string | null = null,
		public isActive?: boolean,
		public defaultWakeUpTime: string | null = null,
		public defaultBedTime: string | null = null,
		public suggestedForDayType?: DayType,
		public tags: string[] = []
	) {
	}
}