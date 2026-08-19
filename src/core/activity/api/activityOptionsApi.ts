import { API } from '@/_common/axiosConfig.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import { useTaskPriorityCrud } from '@/core/todoList/api/taskPriorityApi.ts'
import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'

/**
 * The lookup lists behind the activity selection form. The first three are this module's own; the last
 * two belong to `todoList` and are only reachable from the form's "from to-do list" / "from routine
 * to-do" fields.
 */
export type ActivityOptionKind = 'role' | 'category' | 'activity' | 'taskPriority' | 'routineTimePeriod'

function fetchAllOptions(entityName: string): Promise<SelectOption[]> {
	return API.get(`/${entityName}/all-options`).then(response => SelectOption.listFromObjects(response.data))
}

/**
 * Plain request functions rather than `useEntityQuery` wrappers for this module's own three, because
 * `activityOptionsStore` is the only caller and it needs different semantics:
 * `useEntityQuery.fetchSelectOptions` aborts its own previous request, which would reject the shared
 * promise the cache has already handed to every waiting consumer. Deduplication happens in the store
 * instead, so there is nothing left to abort.
 *
 * The two `todoList` lookups go through that module's `api/` composable instead of repeating its
 * routes here — a fresh composable per call, so each has its own abort controller and they never
 * cancel each other. Cross-module via `api/` is the sanctioned direction.
 *
 * Error snackbars still come from the axios interceptor; the store tracks loading and re-throws.
 */
const OPTION_FETCHERS: Record<ActivityOptionKind, () => Promise<SelectOption[]>> = {
	role: () => fetchAllOptions('activity-role'),
	category: () => fetchAllOptions('activity-category'),
	activity: () => fetchAllOptions('activity'),
	taskPriority: () => useTaskPriorityCrud().fetchSelectOptions(),
	routineTimePeriod: () => useRoutineTimePeriodCrud().fetchSelectOptions(),
}

export function fetchActivityOptions(kind: ActivityOptionKind): Promise<SelectOption[]> {
	return OPTION_FETCHERS[kind]()
}

/**
 * The role × category combination matrix, which differs per source — an activity reachable from the
 * planner is not necessarily reachable from history.
 *
 * Note that despite the name it carries no priority or period data: the backend sets
 * `taskPriorityOption` and `routineTimePeriodOption` to a hard-coded null on all three sources. Those
 * two lists come from `OPTION_FETCHERS` above instead.
 */
export function fetchActivityFormSelectOptionCombinations(
	source: ActivityOptionsSource,
): Promise<ActivitySelectOptionCombination[]> {
	return API.get(`/${source}/form-select-options`).then(response =>
		ActivitySelectOptionCombination.listFromObjects(response.data),
	)
}
