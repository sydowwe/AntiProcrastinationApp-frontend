import type {Time} from '@/utils/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

export class TemplatePlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime?: Time,
		public endTime?: Time,
		public isBackground?: boolean,
		public isOptional?: boolean,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public priorityId: number | null = null,
		public templateId?: number
	) {
	}
}