import { Time } from '@/dtos/dto/Time.ts'
import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'

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
		const now = new Date()
		const newHours = now.getHours() + 1
		const newMinutes = Math.ceil(now.getMinutes() / 5) * 5
		return new TemplatePlannerTaskRequest(
			new Time(now.getHours(), newMinutes),
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
