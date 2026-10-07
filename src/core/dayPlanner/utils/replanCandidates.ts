import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

/**
 * Whether a block is one the server's re-plan (FO4) would pick up as **missed**: not started, not
 * background, its activity not marked unavoidable, and its end passed on the user's clock.
 *
 * This only decides whether to *offer* the re-plan. The server owns the rule (`PlannerTaskMissedRule`) and
 * the packing, and answers "nothing to re-plan" if the two ever disagree. Kept to the same four conditions
 * so they do not: an offer that opens onto "nothing to do" is worse than no offer.
 *
 * A *late* block (started on paper, end not reached) is deliberately not enough to offer it. The server
 * moves late blocks too, but five minutes into a block is not the moment to suggest the day has slipped.
 *
 * `nowMinutes` is minutes past midnight in the user's zone (`minutesOfDayInUserZone`), and the caller is
 * responsible for only asking about today.
 */
export function isMissedAndMovable(task: PlannerTask, nowMinutes: number): boolean {
	return (
		task.id > 0 &&
		task.status === PlannerTaskStatus.NotStarted &&
		!task.isBackground &&
		!task.activity.isUnavoidable &&
		task.endTime.getInMinutes <= nowMinutes
	)
}
