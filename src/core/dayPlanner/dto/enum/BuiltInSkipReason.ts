/**
 * The skip reasons the app offers itself (the home widget's *Skip* menu), as opposed to the user's own
 * `predefinedSkipReasons` and whatever they type into the day planner's skip dialog.
 *
 * Owned here rather than by `home` because `PlannerTask.skipReason` is this module's field, and
 * recognising these three when counting reasons (`utils/skipReasonGroups.ts`) is this module's job.
 * Labels live under `planner.skipReason.*`.
 *
 * Stored as a key since B1 (`prompts/captured-data/backend/B1-*.md`): the status PATCH takes
 * `skipReasonKey`, and a task carries either it or a free-text `skipReason`, never both. The server
 * also converts the six labels (these three, SK and EN) to the key whether they arrive as text or
 * already sat in old rows. So the labels are now free to be reworded — past the six strings that
 * conversion matches, which the server holds, not this file.
 *
 * The values are the wire spelling (camelCase), so `convertToEnum` — which maps member names — does
 * not apply; `parseBuiltInSkipReason` does the membership check instead.
 */
export enum BuiltInSkipReason {
	NoTime = 'noTime',
	NotRelevant = 'notRelevant',
	NoEnergy = 'noEnergy',
}

export const BUILT_IN_SKIP_REASONS = Object.values(BuiltInSkipReason)

/** A key the server sent, or null — including for a value this client does not know yet. */
export function parseBuiltInSkipReason(raw: unknown): BuiltInSkipReason | null {
	return BUILT_IN_SKIP_REASONS.find(key => key === raw) ?? null
}
