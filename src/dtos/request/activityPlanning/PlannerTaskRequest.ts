import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import type {Time} from '@/utils/Time.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

export class PlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime?: Time,
		public endTime?: Time,
		public isBackground?: boolean,
		public isOptional?: boolean,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public priorityId: number | null = null,
		public isDone?: boolean,
		public date: Date = new Date(),
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
			entity.isBackground,
			entity.isOptional,
			entity.location ?? null,
			entity.notes ?? null,
			entity.activity.id,
			entity.priority?.id ?? null,
			entity.isDone,
			entity.date,
			entity.todolistId ?? null,
		)
	}
}