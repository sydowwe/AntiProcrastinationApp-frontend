import { API } from '@/_common/axiosConfig.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'

/** The three lookup lists behind the activity pickers. */
export type ActivityOptionKind = 'role' | 'category' | 'activity'

const OPTION_ENTITY: Record<ActivityOptionKind, string> = {
	role: 'activity-role',
	category: 'activity-category',
	activity: 'activity',
}

/**
 * Plain request functions rather than `useEntityQuery` wrappers, because `activityOptionsStore` is the
 * only caller and it needs different semantics: `useEntityQuery.fetchSelectOptions` aborts its own
 * previous request, which would reject the shared promise the cache has already handed to every
 * waiting consumer. Deduplication happens in the store instead, so there is nothing left to abort.
 *
 * Error snackbars still come from the axios interceptor; the store tracks loading and re-throws.
 */
export function fetchActivityOptions(kind: ActivityOptionKind): Promise<SelectOption[]> {
	return API.get(`/${OPTION_ENTITY[kind]}/all-options`).then(response => SelectOption.listFromObjects(response.data))
}

/**
 * The role × category × priority × period combination matrix, which differs per source — an activity
 * reachable from the planner is not necessarily reachable from history.
 */
export function fetchActivityFormSelectOptionCombinations(
	source: ActivityOptionsSource,
): Promise<ActivitySelectOptionCombination[]> {
	return API.get(`/${source}/form-select-options`).then(response =>
		ActivitySelectOptionCombination.listFromObjects(response.data),
	)
}
