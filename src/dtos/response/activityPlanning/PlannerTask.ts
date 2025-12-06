import {type IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {TaskStatus} from '@/dtos/enum/TaskStatus.ts';
import {Activity} from '@/dtos/response/Activity.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';

export class PlannerTask implements IBasePlannerTask {
	constructor(
		public id: number,
		public startTime: string,
		public endTime: string,
		public isBackground: boolean,
		public isOptional: boolean,
		public activity: Activity,
		public location?: string,
		public notes?: string,
		public priority?: TaskPriority,
		public isDone?: boolean,
		public status?: TaskStatus,
		public actualStartTime: string | null = null,
		public actualEndTime: string | null = null,
		public isFromTemplate?: boolean,
		public sourceTemplateTaskId: number | null = null,
		public skipReason: string | null = null,
		public calendarId?: number,
		public todolistId: number | null = null,
		public color?: string,
		public estimatedMinuteLength?: number,
		public gridRowStart?: number,
		public gridRowEnd?: number,
		public isDuringBackgroundEvent?: boolean,
	) {
	}

	static fromJson(json: any): PlannerTask {
		return new PlannerTask(
			json.id,
			json.startTime,
			json.endTime,
			json.isBackground,
			json.isOptional,
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.priority ? TaskPriority.fromJson(json.priority) : undefined,
			json.isDone,
			json.status,
			json.actualStartTime ?? null,
			json.actualEndTime ?? null,
			json.isFromTemplate,
			json.sourceTemplateTaskId ?? null,
			json.skipReason ?? null,
			json.calendarId,
			json.todolistId ?? null,
			json.color,
			json.estimatedMinuteLength,

			0,
			0,
			false,
		);
	}
}
