/**
 * What a day does to the planner streak — the server's `PlannerStreakService.PlannerDayOutcome`.
 * Only `PlannerStreak.todayOutcome` carries it.
 */
export enum PlannerDayOutcome {
	/** Nothing that counts was planned (none, or only optional, background or skipped tasks). The run is safe. */
	Empty = 'empty',
	/** Every task left to do is done. Today has been added to the run. */
	Complete = 'complete',
	/** Work is left. Today still has to be earned, or the run breaks at midnight. */
	Incomplete = 'incomplete',
}
