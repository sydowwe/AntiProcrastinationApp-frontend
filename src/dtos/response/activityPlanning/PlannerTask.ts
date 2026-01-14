import {type IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {TaskStatus} from '@/dtos/enum/TaskStatus.ts';
import {Activity} from '@/dtos/response/Activity.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {Time} from '@/utils/Time.ts';
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';

export class PlannerTask implements IBasePlannerTask<PlannerTaskRequest> {
	constructor(
		public id: number,
		public startTime: Time,
		public endTime: Time,
		public calendarId: number,
		public isBackground: boolean,
		public isOptional: boolean,
		public isDone: boolean,
		public activity: Activity,
		public location: string | null,
		public notes: string | null,
		public priority: TaskPriority | null,
		public status?: TaskStatus,
		public actualStartTime: string | null = null,
		public actualEndTime: string | null = null,
		public isFromTemplate?: boolean,
		public sourceTemplateTaskId: number | null = null,
		public skipReason: string | null = null,
		public todolistId: number | null = null,
		public color?: string,
		public estimatedMinuteLength?: number,
		public gridRowStart: number = -1,
		public gridRowEnd: number = -1,
		public isDuringBackgroundEvent: boolean = false,
	) {
	}
	
	toRequest(): PlannerTaskRequest {
		return PlannerTaskRequest.fromEntity(this)
	}

	toSpan(): { startTime: Time; endTime: Time } {
		return {startTime: this.startTime, endTime: this.endTime};
	}

	static fromTemplateTask(calendarId: number, templateTask: TemplatePlannerTask): PlannerTask {
		return new PlannerTask(
			-templateTask.id,
			templateTask.startTime,
			templateTask.endTime,
			calendarId,
			templateTask.isBackground,
			templateTask.isOptional,
			false,
			templateTask.activity,
			templateTask.location,
			templateTask.notes,
			templateTask.priority,
		)
	}

	static fromJson(json: any): PlannerTask {
		return new PlannerTask(
			json.id,
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.calendarId,
			json.isBackground,
			json.isOptional,
			json.isDone ?? false,
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.priority ? TaskPriority.fromJson(json.priority) : null,
			json.status,
			json.actualStartTime ?? null,
			json.actualEndTime ?? null,
			json.isFromTemplate,
			json.sourceTemplateTaskId ?? null,
			json.skipReason ?? null,
			json.todolistId ?? null,
			json.color,
			json.estimatedMinuteLength,

			0,
			0,
			false,
		);
	}
}
