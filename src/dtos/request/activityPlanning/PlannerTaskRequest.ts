import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import {Time} from '@/utils/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

export class PlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(23, 0),
		public calendarId?: number,
		public isBackground: boolean = false,
		public isOptional: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public priorityId: number | null = null,
		public isDone: boolean = false,
		public todolistId: number | null = null,
		public color: string = '#4287f5',
	) {
	}

	static fromSpan(startTime: Time, endTime: Time): PlannerTaskRequest {
		return new PlannerTaskRequest(startTime, endTime);
	}

	static fromEntity(entity: PlannerTask): PlannerTaskRequest {
		return new PlannerTaskRequest(
			entity.startTime,
			entity.endTime,
			entity.calendarId,
			entity.isBackground,
			entity.isOptional,
			entity.location ?? null,
			entity.notes ?? null,
			entity.activity.id,
			entity.priority?.id ?? null,
			entity.isDone ?? false,
			entity.todolistId ?? null,
			entity.color ?? '#4287f5',
		)
	}
}