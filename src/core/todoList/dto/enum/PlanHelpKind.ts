/**
 * FO3: the kind of help the server offers on a to-do item that keeps slipping in the planner — three or more
 * attempts skipped, carried over or missed, and none completed. Chosen server-side from *how* the attempts
 * failed (`TodoListItemPlanHelp` in the API):
 * - `smallerStep` — no-energy skips, carry-overs, missed blocks: the item is too big to begin.
 * - `shorterBlock` — mostly "ran out of time": ten minutes fits where the block did not.
 * - `reconsider` — mostly "not relevant any more": the user already said so.
 *
 * The response carries only this kind, never how many times the item slipped. Keep it that way here too:
 * the offer is help, and a count would turn it into a score.
 *
 * The values are the wire spelling, so `convertToEnum` (which maps member names) does not apply;
 * `parsePlanHelpKind` does the membership check.
 */
export enum PlanHelpKind {
	SmallerStep = 'smallerStep',
	ShorterBlock = 'shorterBlock',
	Reconsider = 'reconsider',
}

/**
 * What the offer lets the user do. Every kind offers all of them; the kind only decides which leads.
 * - `startShort` — a 10-minute timer, whatever the item's estimate.
 * - `split` / `pairReward` — the edit dialog, opened on its steps or its reward field.
 * - `letGo` — the ordinary delete, confirmation and undo included.
 */
export type PlanHelpAction = 'startShort' | 'split' | 'pairReward' | 'letGo'

/** The `startShort` timer's length. Also the `{minutes}` in its button label. */
export const SHORT_START_MINUTES = 10

const PLAN_HELP_KINDS = Object.values(PlanHelpKind)

/** A kind the server sent, or null — including for a value this client does not know yet. */
export function parsePlanHelpKind(raw: unknown): PlanHelpKind | null {
	return PLAN_HELP_KINDS.find(kind => kind === raw) ?? null
}
