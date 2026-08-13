import { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

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
	) {}

	// The response also carries a top-level `streak`. It is deliberately not modelled yet: home still
	// reads its flame chip from `plannerStreakStore` (localStorage), and swapping that for the server
	// value is B1's scope, not B2's — it needs the streak *rules* settled first.
	static fromJson(json: any): DayPlan {
		const { date, calendar = null, tasks = [], hasPlan = false } = json ?? {}
		return new DayPlan(
			date,
			calendar == null ? null : Calendar.fromJson(calendar),
			PlannerTask.listFromJsonList(tasks),
			hasPlan,
		)
	}
}
