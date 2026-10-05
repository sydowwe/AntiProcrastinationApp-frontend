import type { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
import type { TemplateAppliedTaskRequest } from '@/core/dayPlanner/dto/request/TemplateAppliedTaskRequest.ts'

export class ApplyTemplateToTaskPlannerBatchRequest {
	constructor(
		public templateId: number,
		public calendarIds: number[],
		public conflictResolution: ApplyTemplateConflictResolution,
		public tasksFromTemplate: TemplateAppliedTaskRequest[],
	) {}
}
