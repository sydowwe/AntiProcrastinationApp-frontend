import type { Time } from '@/_common/dto/dto/Time.ts'

/** `YYYY-MM-DD` of the day after `isoDate`, by calendar arithmetic (no zone can shift it). */
function nextIsoDate(isoDate: string): string {
	const date = new Date(`${isoDate}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + 1)
	return date.toISOString().slice(0, 10)
}

/**
 * Whether a block on `viewedIsoDate` has already ended, on the user's clock: `todayIsoDate` and `nowMinutes`
 * are today and minutes past midnight in the user's zone (`isoDateInUserZone`, `minutesOfDayInUserZone`).
 *
 * The day matters, not just the time of day. Reading only the end time against the current one dimmed every
 * block on a *future* day that ends earlier in the day than it is now, and left blocks on past days undimmed
 * once evening came round. An end before the start wraps past midnight and ends on the next day, as
 * `overrunMinutes` reads it.
 */
export function isBlockPast(
	viewedIsoDate: string,
	start: Time,
	end: Time,
	todayIsoDate: string,
	nowMinutes: number,
): boolean {
	const endIsoDate = end.getInMinutes < start.getInMinutes ? nextIsoDate(viewedIsoDate) : viewedIsoDate
	if (endIsoDate !== todayIsoDate) return endIsoDate < todayIsoDate
	return end.getInMinutes <= nowMinutes
}
