import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

/**
 * How far past its planned end a started block must run before it counts as an overrun. The server's
 * `PlannerSlipNudgeJobHandler.OverrunGrace`, so the day view offers "wrap up or extend?" from the same
 * minute the `PlannedBlockOverrun` notification can arrive, and not before.
 */
export const OVERRUN_GRACE_MINUTES = 5

const MINUTES_IN_DAY = 1440

/**
 * How many minutes a block has run past its planned end, or `null` when it is not an overrun: the server's
 * rule (P1-04) — a foreground block the user started, still `InProgress`, at least the grace past its end.
 *
 * An end before the start wrapped past midnight, so it is measured on the next day — the server's
 * `PlannerTaskMissedRule.EndsAt` convention. A 23:00–00:30 block is not "over" at 23:30.
 *
 * Not checked here, deliberately: the server also skips blocks with `AutoCompleteAtEnd`, which this DTO does not
 * carry. Those are closed by the server at their end, so one only lingers here until the next load.
 *
 * `nowMinutes` is minutes past midnight in the user's zone (`minutesOfDayInUserZone`), and the caller is
 * responsible for only asking about today.
 */
export function overrunMinutes(task: PlannerTask, nowMinutes: number): number | null {
	if (task.id <= 0 || task.isBackground || task.status !== PlannerTaskStatus.InProgress) return null

	const start = task.startTime.getInMinutes
	const rawEnd = task.endTime.getInMinutes
	const end = rawEnd < start ? rawEnd + MINUTES_IN_DAY : rawEnd
	const over = nowMinutes - end
	return over >= OVERRUN_GRACE_MINUTES ? over : null
}
