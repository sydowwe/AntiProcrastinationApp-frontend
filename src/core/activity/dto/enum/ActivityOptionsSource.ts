/**
 * Which set of activities a selection form offers. The value is the endpoint prefix — the request is
 * `GET /{source}/form-select-options` — so it has to match the backend's `EntityRoute` exactly.
 *
 * `ALL` returns every activity the user owns; the other two return only activities already referenced
 * by a history or planner row, so both are strict subsets of `ALL` with identical field values.
 */
export enum ActivityOptionsSource {
	ALL = 'activity',
	ACTIVITY_HISTORY = 'activity-history',
	// `planner-task`, not `task-planner`: the endpoint's EntityRoute is `planner-task`, matching
	// `dayPlanner/api/plannerTaskApi.ts`. The old value would have 404'd — latent so far only because
	// nothing passes this member as a `selectOptionsSource` yet.
	PLANNER_TASK = 'planner-task',
}
