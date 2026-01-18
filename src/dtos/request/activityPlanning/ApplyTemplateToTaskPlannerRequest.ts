import type {ApplyTemplateConflictResolution} from '@/dtos/enum/ApplyTemplateConflictResolution.ts';
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';

export class ApplyTemplateToTaskPlannerRequest {
	constructor(
		public templateId: number,
		public calendarId: number,
		public conflictResolution: ApplyTemplateConflictResolution,
		public tasksFromTemplate: PlannerTaskRequest[]
	) {
	}
}
