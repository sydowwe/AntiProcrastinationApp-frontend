/**
 * The welcome-back card's choice for the overdue to-dos (FO5). Sent as these values; the server's enum
 * binding is case-insensitive, the same as `ReplanWontFitResolution`.
 *
 * - `spread`: dealt out oldest first over today and the next few days (`FRESH_START_SPREAD_DAYS`). Each
 *   move counts as a postponement, exactly as the overdue banner's "move them all" does.
 * - `someday`: the due date is cleared and the item stays on its list.
 * - `keep`: left alone.
 */
export enum FreshStartTodoChoice {
	Spread = 'spread',
	Someday = 'someday',
	Keep = 'keep',
}

/**
 * The card's choice for the planner blocks left open while the user was away.
 *
 * - `closeAsAway`: skipped with the reason `away`, which counts as no failed attempt anywhere.
 * - `carryToToday`: moved to today at the same time of day. A repeating rule's block is closed instead,
 *   because the rule puts today's own on the plan.
 * - `keep`: left alone; the day view's carry-over banner still offers the last week of them.
 */
export enum FreshStartTaskChoice {
	CloseAsAway = 'closeAsAway',
	CarryToToday = 'carryToToday',
	Keep = 'keep',
}

/** How many days, today included, a spread deals the to-dos over. The server accepts 1–14. */
export const FRESH_START_SPREAD_DAYS = 5
