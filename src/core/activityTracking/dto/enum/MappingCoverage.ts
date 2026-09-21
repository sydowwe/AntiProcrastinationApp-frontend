/**
 * The `coverage` filter on the two distinct-entries grids (B24): which tuples to list, judged by whether
 * an active mapping rule would match them today. Wire spelling equals the value, so no `convertToEnum`.
 *
 * `All` is the server's default and the raw observation record; `Uncovered` is the "still to decide"
 * view; `Covered` is the audit view. `itemsCount` is exact in every mode.
 */
export enum MappingCoverage {
	All = 'All',
	Uncovered = 'Uncovered',
	Covered = 'Covered',
}

/** The target group of the rule that covers a tuple — the three groups the API's check constraint names. */
export enum MappingCoverageTarget {
	Activity = 'Activity',
	RoleOrCategory = 'RoleOrCategory',
	Ignored = 'Ignored',
}
