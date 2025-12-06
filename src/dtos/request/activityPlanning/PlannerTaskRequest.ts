import {BasePlannerTaskRequest} from '@/dtos/request/activityPlanning/BasePlannerTaskRequest.ts';
import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';

export class PlannerTaskRequest extends BasePlannerTaskRequest {
	constructor(
		public startTime?: string,
		public endTime?: string,
		public isBackground?: boolean,
		public isOptional?: boolean,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public priorityId: number | null = null,
		public isDone?: boolean,
		public calendarId?: number,
		public todolistId: number | null = null,
	) {
		super(startTime, endTime, isBackground, isOptional, location, notes, activityId, priorityId);
	}

	static fromSpan(startTime: string, endTime: string): PlannerTaskRequest {
		return new PlannerTaskRequest(startTime, endTime);
	}

	static fromEntity(entity: PlannerTask): PlannerTaskRequest {
		return new PlannerTaskRequest(
			entity.startTime,
			entity.endTime,
			entity.isBackground,
			entity.isOptional,
			entity.location ?? null,
			entity.notes ?? null,
			entity.activity.id,
			entity.priority?.id ?? null,
			entity.isDone,
			entity.calendarId,
			entity.todolistId ?? null,
		)
	}
}