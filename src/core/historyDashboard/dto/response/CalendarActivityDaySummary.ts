import { CalendarActivityRoleSummary } from '@/core/historyDashboard/dto/response/CalendarActivityRoleSummary.ts'
import { DayType } from '@/_common/dto/enum/DayType.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { isTodayInUserZone } from '@/_common/composable/general/useUserClock.ts'

export class CalendarActivityDaySummary {
	constructor(
		public readonly id: number,
		public readonly date: string,
		public readonly dayType: DayType,
		public readonly dayIndex: number,
		public readonly label: string | null,
		public readonly holidayName: string | null,
		/**
		 * B2: never null. `required TimeOnly` on the entity, non-nullable column, constructed
		 * unconditionally in the endpoint — there is no path that emits null for either.
		 *
		 * There is no "not recorded" state either: an untouched day carries the backend defaults, wake
		 * `08:00` and bed `00:00`. A rendered bed time of midnight means "never edited", and the client
		 * cannot tell that apart from a user who really went to bed at 00:00.
		 */
		public readonly wakeUpTime: Time,
		public readonly bedTime: Time,
		public readonly totalSeconds: number,
		public readonly sessionCount: number,
		public readonly topRoles: CalendarActivityRoleSummary[],
		/**
		 * B2: the endpoint projects the user's *calendar rows*, not the requested date range, so a day
		 * with no row is absent from the response entirely rather than returned zeroed. Rows are seeded
		 * only for the current and next year at account-creation time, so any older or further-out range
		 * comes back short.
		 *
		 * `false` marks a day this client synthesized to fill such a gap. There is no calendar row behind
		 * it, so its day type and sleep times are placeholders and must not be rendered as recorded data.
		 */
		public readonly hasRecord: boolean = true,
	) {}

	get isToday() {
		// `date` is a calendar day (`YYYY-MM-DD` off the server), compared against what day it is
		// *now* — an instant read, so it must resolve in the user's zone, not UTC.
		return isTodayInUserZone(this.date)
	}

	get isWeekend() {
		// B2: `dayIndex` is 1-based Monday (Mon=1 … Sat=6, Sun=7), matching the backend's own `IsWeekend`.
		return this.dayIndex === 6 || this.dayIndex === 7
	}

	/**
	 * A day inside the requested range that the backend returned no row for — see `hasRecord`.
	 *
	 * The id is the date's digits negated, so it keys the grid stably while never colliding with a real
	 * row's id.
	 */
	static placeholder(date: string): CalendarActivityDaySummary {
		const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
		// `getDay()` is 0-based Sunday; the grid keys columns by the backend's 1-based Monday.
		const dayIndex = ((new Date(year, month - 1, day).getDay() + 6) % 7) + 1
		return new CalendarActivityDaySummary(
			-Number(date.split('-').join('')),
			date,
			dayIndex >= 6 ? DayType.Weekend : DayType.Workday,
			dayIndex,
			null,
			null,
			new Time(0, 0),
			new Time(0, 0),
			0,
			0,
			[],
			false,
		)
	}

	static fromJson(json: any): CalendarActivityDaySummary {
		return new CalendarActivityDaySummary(
			json.id,
			json.date,
			convertToEnum(DayType, json.dayType),
			json.dayIndex,
			json.label ?? null,
			json.holidayName ?? null,
			Time.fromJson(json.wakeUpTime),
			Time.fromJson(json.bedTime),
			json.totalSeconds ?? 0,
			json.sessionCount ?? 0,
			json.topRoles?.map((r: any) => CalendarActivityRoleSummary.fromJson(r)) ?? [],
		)
	}
}
