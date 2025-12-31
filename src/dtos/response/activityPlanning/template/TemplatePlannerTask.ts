import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import {Activity} from '@/dtos/response/Activity.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {Time} from '@/utils/Time.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';

export class TemplatePlannerTask implements IBasePlannerTask<TemplatePlannerTaskRequest> {
	constructor(
		public id: number,
		public templateId: number,
		public startTime: Time,
		public endTime: Time,
		public isBackground: boolean,
		public isOptional: boolean,
		public activity: Activity,
		public location: string | null,
		public notes: string | null,
		public priority: TaskPriority | null,
		public gridRowStart: number = -1,
		public gridRowEnd: number = -1,
		public isDuringBackgroundEvent: boolean = false,
	) {
	}

	toRequest(): TemplatePlannerTaskRequest {
		return TemplatePlannerTaskRequest.fromEntity(this)
	}

	toSpan(): { startTime: Time; endTime: Time } {
		return {startTime: this.startTime, endTime: this.endTime};
	}

	static fromJson(json: any) {
		return new TemplatePlannerTask(
			json.id,
			json.templateId,
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.isBackground,
			json.isOptional,
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.priority ? TaskPriority.fromJson(json.priority) : null,
			json.gridRowStart,
			json.gridRowEnd,
			json.isDuringBackgroundEvent,
		)
	}
}