import { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerStreak } from '@/core/dayPlanner/dto/response/PlannerStreak.ts'

/**
 * One day's plan, from `GET calendar/day-plan/{date}` — see `prompts/home/backend/B2-plan-by-date.md`.
 *
 * Replaces the calendar-then-tasks pair the home page used to make, which cost two strictly
 * serialized round-trips because the task filter was keyed on a calendar id the client had to fetch
 * first.
 *
 * `hasPlan`, not `calendar !== null`, is the "did the user plan this day" signal. Calendars are
 * bulk-seeded for whole years, so a row exists for every date inside the seeded window whether or
 * not anything was ever planned in it, and no row exists outside that window however much was
 * planned. Branching on calendar presence is wrong in both directions.
 */
export class DayPlan {
	constructor(
		public readonly date: string,
		public readonly calendar: Calendar | null,
		public readonly tasks: PlannerTask[],
		public readonly hasPlan: boolean,
		/**
		 * Top-level rather than on the nested `calendar`, which is what makes it survive the days
		 * where there is no calendar — the flame chip should not vanish just because nothing was
		 * planned. `calendar.streak` is nulled by the server on this route for that reason.
		 */
		public readonly streak: PlannerStreak,
	) {}

	static fromJson(json: any): DayPlan {
		const { date, calendar = null, tasks = [], hasPlan = false, streak = null } = json ?? {}
		return new DayPlan(
			date,
			calendar == null ? null : Calendar.fromJson(calendar),
			PlannerTask.listFromJsonList(tasks),
			hasPlan,
			streak == null ? PlannerStreak.empty() : PlannerStreak.fromJson(streak),
		)
	}
}
