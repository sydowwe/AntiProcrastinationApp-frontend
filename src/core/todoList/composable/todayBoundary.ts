import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'

/**
 * Local midnight of the **user's** today, as a calendar-day `Date`.
 *
 * "Which day is it now" is an instant question (class 1) and must be answered in the user's
 * configured zone — `new Date(); setHours(0,0,0,0)` answers it in the browser's, so a user whose
 * profile zone differs from their device's sees due dates flip a day early or late.
 *
 * The `Date` this returns is a **calendar day** (class 2): its browser-local year/month/day fields
 * ARE the value, which is exactly what `dueDate + 'T00:00:00'` parses to and what `formatDateForApi`
 * reads back. Do not pass it to `isoDateInUserZone` — that would shift it by the offset again.
 *
 * `days` is plain class-3 date arithmetic on top and is zone-independent.
 */
export function startOfUserDayPlus(days: number = 0): Date {
	const [year, month, day] = isoDateInUserZone().split('-').map(Number)
	const date = new Date(year!, month! - 1, day!)
	if (days !== 0) date.setDate(date.getDate() + days)
	return date
}
