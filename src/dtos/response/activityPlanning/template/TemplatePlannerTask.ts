import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import {Activity} from '@/dtos/response/Activity.ts';
import {Time} from '@/utils/Time.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';

export class TemplatePlannerTask implements IBasePlannerTask<TemplatePlannerTaskRequest> {
	constructor(
		public id: number,
		public templateId: number,
		public startTime: Time,
		public endTime: Time,
		public isBackground: boolean,
		public activity: Activity,
		public location: string | null,
		public notes: string | null,
		public importance: TaskImportance | null,
		public color: string,
		public gridRowStart: number = -1,
		public gridRowEnd: number = -1,
		public isDuringBackgroundTask: boolean = false,
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
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.importance ? TaskImportance.fromJson(json.importance) : null,
			json.color,
			json.gridRowStart,
			json.gridRowEnd,
			json.isDuringBackgroundTask,
		)
	}
}