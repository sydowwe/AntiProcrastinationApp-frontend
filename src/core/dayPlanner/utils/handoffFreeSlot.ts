import { roundToNearestInterval } from '@/_common/utils/DateTimeHelper.ts'

/**
 * The grid the planner dialog's start picker snaps to: `TimeRangePicker`'s default `allowedMinutesSelected`,
 * which `BasePlannerTaskDialog` does not override. `TimePicker` rounds any time it is handed to the
 * *nearest* step, so a 20:15 written into the form shows, and saves, as 20:20.
 */
export const PLANNER_START_GRID_MINUTES = 10

/**
 * Where a to-do handoff asks `next-free-slot` to start searching on today (FO4): now, rounded up to the
 * picker's grid. The server searches from the exact minute, and an off-grid answer is moved by the picker.
 * Can be 1440 just before midnight; the server then has no room, which is the right answer.
 */
export function handoffSearchFloor(nowMinutes: number, gridMinutes = PLANNER_START_GRID_MINUTES): number {
	return Math.ceil(nowMinutes / gridMinutes) * gridMinutes
}

/**
 * Whether the dialog's start is still the one it filled in by itself, so a new free-slot answer may replace
 * it. Compared on the picker's grid, because the picker may already have rounded the filled-in time: that
 * is not the user choosing one.
 */
export function isStillPrefilledStart(
	currentStartMinutes: number | null,
	prefilledStartMinutes: number | null,
	gridMinutes = PLANNER_START_GRID_MINUTES,
): boolean {
	if (currentStartMinutes == null || prefilledStartMinutes == null) return false
	return (
		roundToNearestInterval(currentStartMinutes, gridMinutes) ===
		roundToNearestInterval(prefilledStartMinutes, gridMinutes)
	)
}
