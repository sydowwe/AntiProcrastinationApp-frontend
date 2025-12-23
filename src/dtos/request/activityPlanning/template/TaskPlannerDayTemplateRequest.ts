import type {DayType} from '@/dtos/enum/DayType.ts';
import {Time} from '@/utils/Time.ts';

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
}