import {BasePlannerTaskResponse} from '@/classes/activityPlanning/BasePlannerTask.ts';
import {Activity} from '@/classes/Activity.ts';
import {TaskPriority} from '@/classes/TaskPriority.ts';

export class TemplatePlannerTask extends BasePlannerTaskResponse{
	constructor(
		public id: string,
		public startTime: string,
		public endTime: string,
		public isBackground: boolean,
		public isOptional: boolean,
		public activity: Activity,
		public location?: string,
		public notes?: string,
		public priority?: TaskPriority
	) {
		super(id, startTime, endTime, isBackground, isOptional, activity, location, notes, priority);
	}
}