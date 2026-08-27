import { API } from '@/_common/axiosConfig.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import type { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'
import { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import { Role } from '@/core/activity/dto/response/Role.ts'

/**
 * The lookup lists behind the activity selection form that this module owns — and therefore the only
 * ones it can keep fresh, since every mutation of them goes through this module's crud composables.
 *
 * The form's "from to-do list" / "from routine to-do" fields need two more lists, but those belong to
 * `todoList` and are edited there. Caching them here made them permanently stale, because invalidating
 * them would mean `todoList/api/` reaching into this module's `store/` — which the module rules forbid,
 * and rightly: a cache nobody can invalidate is worse than no cache. `useActivitySelectionFormState`
 * fetches those two straight from `todoList/api/` instead. They are small and only fetched when those
 * fields are actually rendered.
 */
export type ActivityOptionKind = 'role' | 'category' | 'activity'

function fetchAllOptions(entityName: string): Promise<SelectOption[]> {
	return API.get(`/${entityName}/all-options`).then(response => SelectOption.listFromObjects(response.data))
}

/**
 * Plain request functions rather than `useEntityQuery` wrappers, because `activityOptionsStore` is the
 * only caller and it needs different semantics: `useEntityQuery.fetchSelectOptions` aborts its own
 * previous request, which would reject the shared promise the cache has already handed to every
 * waiting consumer. Deduplication happens in the store instead, so there is nothing left to abort.
 *
 * Error snackbars still come from the axios interceptor; the store tracks loading and re-throws.
 */
const OPTION_FETCHERS: Record<ActivityOptionKind, () => Promise<SelectOption[]>> = {
	role: () => fetchAllOptions('activity-role'),
	category: () => fetchAllOptions('activity-category'),
	activity: () => fetchAllOptions('activity'),
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
	includeArchived = false,
): Promise<ActivitySelectOptionCombination[]> {
	// The parameter is omitted rather than sent as `false`, so every picker's request stays byte-identical
	// to what it sent before archiving existed. Only the surfaces that must still *name* an archived
	// activity opt in — see the doc comment on `includeArchived` in `ActivitySelectionForm.vue`.
	const query = includeArchived ? '?includeArchived=true' : ''
	return API.get(`/${source}/form-select-options${query}`).then(response =>
		ActivitySelectOptionCombination.listFromObjects(response.data),
	)
}

/**
 * The id of one of the three system roles, or `null` when it cannot be resolved.
 *
 * Looks the role up by its stable `systemKey`, never by display name — renaming a role in
 * `/activity-settings/roles` is fully permitted and used to break quick-create from four dialogs.
 * `SystemActivityRole`'s values are the wire keys verbatim (the server parses them case-insensitively
 * and its C# enum carries `[JsonStringEnumMemberName]`), so there is no mapping table here any more.
 *
 * Resolves to `null` rather than rejecting, and goes out `_silent` so the interceptor stays quiet: the
 * caller shows `activities.systemRoleMissing`, which says what actually happened, instead of the generic
 * error snackbar a rejection produced before.
 *
 * The 404 is now only reachable by accounts that renamed one of the three *before* the backend's
 * name-based backfill ran — those rows kept `systemKey: null` and cannot be identified automatically
 * (see `prompts/activity/backend/A8-backend.md`). Deleting a keyed role is refused server-side and a
 * rename preserves the key, so nothing else produces it.
 */
export function fetchSystemActivityRoleId(role: SystemActivityRole): Promise<number | null> {
	return API.get(`/activity-role/by-system-key/${role}`, { _silent: true })
		.then(response => {
			const id = response.data != null ? Role.fromJson(response.data).id : 0
			return id > 0 ? id : null
		})
		.catch(() => null)
}
