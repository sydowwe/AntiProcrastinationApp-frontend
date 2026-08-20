/**
 * Identifies one dashboard group row — a pie segment, a summary card, a stacked-bar segment — so the
 * three can cross-highlight each other without comparing display names.
 *
 * B1: every row carries `groupId`, the id of the entity named by the request's `groupBy` (activity id
 * for `ACTIVITY`, role id for `ROLE`, category id for `CATEGORY`). It is null on exactly the two rows
 * the backend synthesizes rather than reads from an entity: `Uncategorized` (only for
 * `groupBy: CATEGORY`) and the pie chart's `_other` roll-up. Those two are keyed by name.
 *
 * Branch on `id === null`, never on the name — a user may name a real activity `_other` or
 * `Uncategorized`, and that row *does* carry an id.
 *
 * Ids are only comparable within one `groupBy`: activity 5, role 5 and category 5 are three different
 * things. Both dashboard views clear the selection in `fetchAll()`, which the `groupBy` watcher runs,
 * so a key never outlives the `groupBy` it was made under.
 */
export interface HistoryGroupKey {
	id: number | null
	name: string
}

export function historyGroupKey(item: { groupId: number | null; name: string }): HistoryGroupKey {
	return { id: item.groupId, name: item.name }
}

export function isSameHistoryGroup(a: HistoryGroupKey | null, b: HistoryGroupKey | null): boolean {
	if (!a || !b) return false
	if (a.id !== null && b.id !== null) return a.id === b.id
	return a.id === null && b.id === null && a.name === b.name
}
