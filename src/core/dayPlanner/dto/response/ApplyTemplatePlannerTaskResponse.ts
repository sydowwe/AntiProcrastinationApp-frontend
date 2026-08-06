import { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

export class ApplyTemplatePlannerTaskResponse {
	constructor(
		public calendar: Calendar,
		public tasks: PlannerTask[],
	) {}

	public static fromJson(json: any): ApplyTemplatePlannerTaskResponse {
		return new ApplyTemplatePlannerTaskResponse(
			Calendar.fromJson(json.calendar),
			PlannerTask.listFromJsonList(json.tasks),
		)
	}
}
