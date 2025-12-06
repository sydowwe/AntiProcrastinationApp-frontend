import {BasePlannerTaskRequest} from '@/dtos/request/activityPlanning/BasePlannerTaskRequest.ts';

export class TemplatePlannerTaskRequest extends BasePlannerTaskRequest {
	constructor(
		public startTime?: string,
		public endTime?: string,
		public isBackground?: boolean,
		public isOptional?: boolean,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public priorityId: number | null = null,
		public templateId?: number
	) {
		super(startTime, endTime, isBackground, isOptional, location, notes, activityId, priorityId);
	}
}