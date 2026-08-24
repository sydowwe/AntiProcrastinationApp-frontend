import type { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
import type { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'

export class ApplyTemplateToTaskPlannerBatchRequest {
	constructor(
		public templateId: number,
		public calendarIds: number[],
		public conflictResolution: ApplyTemplateConflictResolution,
		public tasksFromTemplate: PlannerTaskRequest[],
	) {}
}
