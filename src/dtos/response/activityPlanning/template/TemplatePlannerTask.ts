import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {Activity} from '@/dtos/response/Activity.ts';
import type {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';

export class TemplatePlannerTask implements IBasePlannerTask {
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
		public gridRowStart?: number,
		public gridRowEnd?: number,
		public isDuringBackgroundEvent?: boolean,
	) {
	}

	static fromJson(json: any) {
		return new TemplatePlannerTask(
			json.id,
			json.startTime,
			json.endTime,
			json.isBackground,
			json.isOptional,
			json.activity,
			json.location,
			json.notes,
			json.priority,
			json.gridRowStart,
			json.gridRowEnd,
			json.isDuringBackgroundEvent,
		)
	}
}