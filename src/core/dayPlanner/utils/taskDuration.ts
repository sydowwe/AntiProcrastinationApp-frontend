import type { Time } from '@/_common/dto/dto/Time.ts'

const MINUTES_IN_DAY = 1440

/**
 * Minutes between two times on the planner grid, where `end` may cross midnight relative to
 * `start` (the module's standing idiom — see CLAUDE.md's day-planner section).
 */
export function getSpanMinutes(start: Time, end: Time): number {
	const startMinutes = start.getInMinutes
	const endMinutes = end.getInMinutes
	return endMinutes > startMinutes ? endMinutes - startMinutes : endMinutes + MINUTES_IN_DAY - startMinutes
}
