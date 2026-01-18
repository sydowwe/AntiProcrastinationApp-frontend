import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';

export class ApplyTemplatePlannerTaskResponse {
	constructor(
		public calendar: Calendar,
		public tasks: PlannerTask[]
	) {
	}

	public static fromJson(json: any): ApplyTemplatePlannerTaskResponse {
		return new ApplyTemplatePlannerTaskResponse(
			Calendar.fromJson(json.calendar),
			PlannerTask.listFromJsonList(json.tasks)
		);
	}
}