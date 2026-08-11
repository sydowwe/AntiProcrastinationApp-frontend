import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'

export class PlannerTaskRequest implements IBasePlannerTaskRequest {
	/**
	 * The day the task is created for. Only set when the dialog shows its own date picker (creating
	 * from outside the viewed day, e.g. from the to-do list); left undefined otherwise, so it stays
	 * out of the request body. Declared here because `PlannerTaskDialog` assigns it.
	 */
	date?: Date

	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(8, 0),
		public calendarId?: number,
		public isBackground: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public activityId?: number,
		public importanceId: number | null = null,
		public status: PlannerTaskStatus = PlannerTaskStatus.NotStarted,
		public todoListItemId: number | null = null,
		public skipReason: string | null = null,
		public actualStartTime: Time | null = null,
		public actualEndTime: Time | null = null,
	) {}

	static createEmpty(): PlannerTaskRequest {
		const now = new Date()
		const newHours = now.getHours() + 1
		const newMinutes = Math.ceil(now.getMinutes() / 5) * 5
		return new PlannerTaskRequest(
			new Time(now.getHours(), newMinutes),
			new Time(newHours === 24 ? 0 : newHours, newMinutes),
		)
	}

	static fromSpan(startTime: Time, endTime: Time): PlannerTaskRequest {
		return new PlannerTaskRequest(startTime, endTime)
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
			entity.status,
			entity.todoListItemId ?? null,
			entity.skipReason,
			entity.actualStartTime,
			entity.actualEndTime,
		)
	}
}
