import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'

/** Only what the rule reads, so a test can build one without an `Activity` and a whole period. */
export type RoutineSuggestionFields = Pick<RoutineTodoListItemEntity, 'suggestedDays' | 'suggestedDayOfMonth'> & {
	timePeriod: Pick<RoutineTodoListItemEntity['timePeriod'], 'lengthInDays'>
}

// `Date#getUTCDay()` order: 0 = Sunday.
const WEEKDAY_BY_INDEX = [
	DayOfWeek.Sunday,
	DayOfWeek.Monday,
	DayOfWeek.Tuesday,
	DayOfWeek.Wednesday,
	DayOfWeek.Thursday,
	DayOfWeek.Friday,
	DayOfWeek.Saturday,
]

/** A daily routine is suggested every day by definition, so a nudge about it says nothing. */
export function isDailyRoutine(item: RoutineSuggestionFields): boolean {
	return item.timePeriod.lengthInDays === 1
}

/**
 * Which calendar day a routine item is meant for — the one rule behind "suggested days".
 *
 * The item carries two already-discriminated fields, `suggestedDays` and `suggestedDayOfMonth`, and
 * its period's length decides which one applies. The edit form (RoutineToDoListForm.vue) switches on
 * the same thresholds, so the field a user can set is always the field read here:
 *
 * - `lengthInDays === 1` → daily, suggested every day;
 * - `lengthInDays > 14`  → monthly: `suggestedDayOfMonth`;
 * - otherwise            → weekly: `suggestedDays` includes the weekday.
 *
 * An item with nothing set for its period is suggested on no day.
 *
 * **A day of month the month does not have lands on its last day.** "The 31st" is September 30th,
 * "the 30th" is February 28th (29th in a leap year). Skipping the month instead would make a
 * monthly routine silently drop out for five months a year, which is the one outcome a nudge must
 * not have. As a consequence items set to the 30th and the 31st share a day in 30-day months.
 *
 * Pure on purpose: the caller resolves *which* day it is — in the user's timezone, from a clock that
 * rolls over — and this only answers for that day. `isoDate` is `YYYY-MM-DD`, read as a calendar
 * day and never as an instant, so the machine's zone cannot shift it.
 */
export function isRoutineSuggestedOn(item: RoutineSuggestionFields, isoDate: string): boolean {
	if (isDailyRoutine(item)) return true

	const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number]
	if (item.timePeriod.lengthInDays > 14) {
		if (item.suggestedDayOfMonth == null) return false
		// Day 0 of the next month is the last day of this one. UTC throughout, so no zone can move it.
		const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
		return Math.min(item.suggestedDayOfMonth, daysInMonth) === day
	}

	const weekday = WEEKDAY_BY_INDEX[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]!
	return item.suggestedDays.includes(weekday)
}
