import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { PlannerDayOutcome } from '@/core/dayPlanner/dto/enum/PlannerDayOutcome.ts'

/**
 * The day-plan completion streak, server-computed — see `prompts/home/backend/B1-planner-streak.md`.
 *
 * Replaces `plannerStreakStore`, which was localStorage-only, per-device, and could not tell
 * "yesterday was also complete" from "the streak started today".
 *
 * `currentStreak` is the value to render, unconditionally. There is no "is it still alive" decision
 * left on this side: a dead streak arrives as 0. The skip rule, the empty-day rule and the day
 * boundary all live server-side, and re-deriving any of them from a last-completed date is guessing
 * — which is exactly how the store this replaces went wrong.
 */
export class PlannerStreak {
	constructor(
		/** Days completed in the run still open today. Already zeroed when the streak has broken. */
		public readonly currentStreak: number,
		/** Longest run ever held. Never below `currentStreak`. */
		public readonly bestStreak: number,
		/**
		 * Whether today's plan is complete under the *streak's* rule, which is not the progress
		 * ring's rule: optional and background tasks are excluded and skipped tasks leave the
		 * denominator, so a day showing 4/5 on the ring can still be complete. Read this rather
		 * than comparing `completedCount` to `totalCount`.
		 */
		public readonly isTodayComplete: boolean,
		/**
		 * Splits `isTodayComplete`'s `false` in two: `Incomplete` (today still has to be earned) and
		 * `Empty` (nothing that counts is planned, so the run can't break today). Same rule, same "real
		 * today, not the day requested" scope.
		 */
		public readonly todayOutcome: PlannerDayOutcome,
		/**
		 * The date the server treated as "today", in `timezone` — the user's own `User.Timezone`,
		 * not UTC and not the browser clock. The client does not compute this any more; it is kept
		 * so a disagreement with the browser's idea of today can be detected rather than silently
		 * producing the wrong day's plan. See `assertServerDateAgrees` in `useTodayPlan.ts`.
		 */
		public readonly today: string,
		/** @see today */
		public readonly timezone: string,
	) {}

	static empty(): PlannerStreak {
		return new PlannerStreak(0, 0, false, PlannerDayOutcome.Empty, '', '')
	}

	static fromJson(json: any): PlannerStreak {
		const {
			currentStreak = 0,
			bestStreak = 0,
			isTodayComplete = false,
			todayOutcome,
			today = '',
			timezone = '',
		} = json ?? {}
		return new PlannerStreak(
			currentStreak,
			bestStreak,
			isTodayComplete,
			// An API without the field still sends `isTodayComplete`; Empty is the safe guess for its `false`,
			// because it claims nothing is at stake rather than nagging about a day that may be clear.
			convertToEnum(PlannerDayOutcome, todayOutcome) ??
				(isTodayComplete ? PlannerDayOutcome.Complete : PlannerDayOutcome.Empty),
			today,
			timezone,
		)
	}
}
