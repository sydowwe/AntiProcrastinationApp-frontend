import type {Time} from '@/utils/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

export class TemplatePlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime?: Time,
		public endTime?: Time,
		public activityId?: number,
		public isBackground: boolean = false,
		public isOptional: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public priorityId: number | null = null,
		public templateId?: number
	) {
	}
}