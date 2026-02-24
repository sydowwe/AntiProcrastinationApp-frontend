import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import {Time} from '@/dtos/dto/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import {PlannerTaskStatus} from '@/dtos/enum/PlannerTaskStatus.ts';

export class PlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(23, 0),
		public calendarId?: number,
		public isBackground: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public importanceId: number | null = null,
		public color: string | null = null,
		public status: PlannerTaskStatus = PlannerTaskStatus.NotStarted,
		public isDone: boolean = false,
		public todolistId: number | null = null,
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
			entity.location ?? null,
			entity.notes ?? null,
			entity.activity.id,
			entity.importance?.id ?? null,
			entity.color,

			entity.status,
			entity.isDone ?? false,
			entity.todolistId ?? null,
		)
	}
}