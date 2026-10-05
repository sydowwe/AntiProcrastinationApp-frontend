import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'

/**
 * One line of an apply-template request: the task, plus the template line it was built from (OP15). The server
 * keeps `sourceTemplateTaskId` only when it is a line of the template being applied, and only an apply writes it,
 * which is why it is not on `PlannerTaskRequest`, whose PUT would otherwise have to round-trip it.
 */
export class TemplateAppliedTaskRequest extends PlannerTaskRequest {
	sourceTemplateTaskId: number | null = null

	static override fromEntity(entity: PlannerTask): TemplateAppliedTaskRequest {
		const request = Object.assign(new TemplateAppliedTaskRequest(), PlannerTaskRequest.fromEntity(entity))
		request.sourceTemplateTaskId = entity.sourceTemplateTaskId
		return request
	}
}
