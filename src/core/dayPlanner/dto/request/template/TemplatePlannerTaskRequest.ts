import { Time } from '@/_common/dto/dto/Time.ts'
import { timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'

export class TemplatePlannerTaskRequest implements IBasePlannerTaskRequest {
	constructor(
		public startTime: Time = new Time(7, 0),
		public endTime: Time = new Time(23, 0),
		public activityId?: number,
		public isBackground: boolean = false,
		public location: string | null = null,
		public notes: string | null = null,
		public importanceId: number | null = null,
		public templateId?: number,
	) {}

	static createEmpty(): TemplatePlannerTaskRequest {
		// The user's zone — same reasoning as `PlannerTaskRequest.createEmpty`.
		const now = timeInUserZone()
		const newHours = now.hours + 1
		const newMinutes = Math.ceil(now.minutes / 5) * 5
		return new TemplatePlannerTaskRequest(
			new Time(now.hours, newMinutes),
			new Time(newHours === 24 ? 0 : newHours, newMinutes),
		)
	}

	static fromEntity(entity: TemplatePlannerTask): TemplatePlannerTaskRequest {
		return new TemplatePlannerTaskRequest(
			entity.startTime,
			entity.endTime,
			entity.activity.id,
			entity.isBackground,
			entity.location,
			entity.notes,
			entity.importance?.id ?? null,
			entity.templateId,
		)
	}
}
