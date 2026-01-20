import {type IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import {Activity} from '@/dtos/response/Activity.ts';
import {Time} from '@/utils/Time.ts';
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';
import {PlannerTaskStatus} from '@/dtos/enum/PlannerTaskStatus.ts';
import {convertToEnum} from '@/composables/general/EnumComposable.ts';

export class PlannerTask implements IBasePlannerTask<PlannerTaskRequest> {
	constructor(
		public id: number,
		public startTime: Time,
		public endTime: Time,
		public calendarId: number,
		public isBackground: boolean,
		public isDone: boolean,
		public activity: Activity,
		public location: string | null,
		public notes: string | null,
		public importance: TaskImportance | null,
		public color: string,
		public status: PlannerTaskStatus,
		public actualStartTime: Time | null = null,
		public actualEndTime: Time | null = null,
		public isFromTemplate?: boolean,
		public sourceTemplateTaskId: number | null = null,
		public skipReason: string | null = null,
		public todolistId: number | null = null,
		public estimatedMinuteLength?: number,
		public gridRowStart: number = -1,
		public gridRowEnd: number = -1,
		public isDuringBackgroundTask: boolean = false,
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
			false,
			templateTask.activity,
			templateTask.location,
			templateTask.notes,
			templateTask.importance,
			templateTask.color,
			PlannerTaskStatus.NotStarted
		)
	}

	static fromJson(json: any): PlannerTask {
		return new PlannerTask(
			json.id,
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.calendarId,
			json.isBackground,
			json.isDone ?? false,
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.importance ? TaskImportance.fromJson(json.importance) : null,
			json.color,
			convertToEnum(PlannerTaskStatus, json.status),
			json.actualStartTime ? Time.fromJson(json.actualStartTime) : null,
			json.actualEndTime ? Time.fromJson(json.actualEndTime) : null,
			json.isFromTemplate,
			json.sourceTemplateTaskId ?? null,
			json.skipReason ?? null,
			json.todolistId ?? null,
			json.estimatedMinuteLength,

			0,
			0,
			false,
		);
	}

	static listFromJsonList(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}
