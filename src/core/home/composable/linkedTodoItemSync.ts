import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'

/**
 * Did this status change tick or untick the to-do item linked to the task?
 *
 * The server sends the task's done state to its linked item on every status patch of a task dated
 * the user's today (`PatchPlannerTaskStatusEndpoint`), so the item follows `Completed` both ways:
 * into it ticks the item, and out of it — reopened, or skipped after all — unticks it. Every other
 * move (`NotStarted` ↔ `InProgress`, skipping an open task) leaves the item as it was.
 *
 * Only today's plan is on the home dashboard, so the "today" condition is already met by every
 * caller; this answers the rest.
 */
export function togglesLinkedTodoItem(
	todoListItemId: number | null,
	previous: PlannerTaskStatus,
	next: PlannerTaskStatus,
): boolean {
	if (todoListItemId == null || previous === next) return false
	return previous === PlannerTaskStatus.Completed || next === PlannerTaskStatus.Completed
}
