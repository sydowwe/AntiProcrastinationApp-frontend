import {Activity} from '@/classes/Activity.ts';
import {TaskPriority} from '@/classes/TaskPriority.ts';

export class BasePlannerTaskResponse {
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
	) {}

	static fromJson(json: any): BasePlannerTaskResponse {
		return new BasePlannerTaskResponse(
			json.id,
			json.startTime,
			json.endTime,
			json.isBackground,
			json.isOptional,
			Activity.fromJson(json.activity),
			json.location,
			json.notes,
			json.priority ? TaskPriority.fromJson(json.priority) : undefined
		);
	}
}