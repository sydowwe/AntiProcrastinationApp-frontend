/**
 * The cross-day plan-vs-actual aggregate — `POST planner-task/plan-vs-actual-trend`, contract in
 * `prompts/day-planner/backend/F2-backend.md`.
 *
 * Six non-negative integers, none nullable, always 200. `taskCount === 0` is the "render nothing"
 * signal, not an error: an empty range, a range still in progress, and a range in the future all
 * arrive as six zeroes.
 *
 * Two traps live in these fields, both load-bearing for how the surface is worded:
 *
 * 1. `plannedMinutes` and `actualMinutes` do **not** cover the same tasks. `plannedMinutes` spans
 *    every task in `taskCount`, abandoned ones included; `actualMinutes` spans only those that are
 *    Completed *and* carry both actual times. So `actualMinutes / plannedMinutes` understates the
 *    person's pace whenever `neverHappenedCount` is non-zero, and is a valid per-task estimation
 *    ratio only when it is zero. There is no planned-minutes subtotal for the measured population
 *    yet — see the follow-up ask in the contract file. Until it lands, this app shows no percentage.
 * 2. `startedLateCount` / `ranLongerCount` are counted over the measured tasks only, never over
 *    `taskCount`. They can be far smaller than `taskCount` with nothing wrong. Never derive an
 *    "on time" figure as `taskCount - startedLateCount`.
 *
 * Today is never included, however late in the day this is called: a day counts only once it is
 * strictly before the user's own today (their `User.Timezone`, not the browser's). That is stricter
 * than the single-day block on purpose — today's untouched tasks have not been missed yet, and
 * every one of them would otherwise land in `neverHappenedCount`. Any copy naming a range must
 * therefore stay vague about its far end rather than promising today.
 */
export class PlanVsActualTrend {
	constructor(
		/** Eligible tasks in range: non-background, not cancelled, on a day that is over, and not Completed-without-actual-times. */
		public readonly taskCount: number,
		/** Planned minutes across every task in `taskCount`. @see PlanVsActualTrend */
		public readonly plannedMinutes: number,
		/** Logged minutes across the measured subset only. @see PlanVsActualTrend */
		public readonly actualMinutes: number,
		/** Of the measured tasks, how many started later than planned. */
		public readonly startedLateCount: number,
		/** Of the measured tasks, how many ran longer than planned. */
		public readonly ranLongerCount: number,
		/** NotStarted / InProgress / OnHold on a day that is over. Cancelled is excluded from `taskCount` entirely. */
		public readonly neverHappenedCount: number,
	) {}

	static empty(): PlanVsActualTrend {
		return new PlanVsActualTrend(0, 0, 0, 0, 0, 0)
	}

	static fromJson(json: any): PlanVsActualTrend {
		const {
			taskCount = 0,
			plannedMinutes = 0,
			actualMinutes = 0,
			startedLateCount = 0,
			ranLongerCount = 0,
			neverHappenedCount = 0,
		} = json ?? {}
		return new PlanVsActualTrend(
			taskCount,
			plannedMinutes,
			actualMinutes,
			startedLateCount,
			ranLongerCount,
			neverHappenedCount,
		)
	}
}
