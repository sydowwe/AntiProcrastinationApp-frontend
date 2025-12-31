import {Time} from '@/utils/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';

export class TemplatePlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(23, 0),
		public activityId?: number,
		public isBackground: boolean = false,
		public isOptional: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public priorityId: number | null = null,
		public templateId?: number
	) {
	}

	static fromEntity(entity: TemplatePlannerTask): TemplatePlannerTaskRequest {
		return new TemplatePlannerTaskRequest(
			entity.startTime,
			entity.endTime,
			entity.activity.id,
			entity.isBackground,
			entity.isOptional,
			entity.location,
			entity.notes,
			entity.priority?.id,
			entity.templateId
		);
	}
}