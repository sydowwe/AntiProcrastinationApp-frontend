import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
import {
	useSecondaryTemplateDayPlannerStore,
	useTemplateDayPlannerStore,
} from '@/core/dayPlanner/store/templateDayPlannerStore.ts'
import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
import { useRoutineReviewStore } from '@/core/todoList/store/routineReviewStore.ts'

/**
 * Clears every app-owned store that is not already safe on its own, so a second sign-in in the same
 * tab starts from nothing rather than the previous account's in-memory state. Call this AFTER the
 * store's own `logout()` — it does not reimplement that call, only extends it.
 *
 * Deliberately does NOT reset, and the reason lives here rather than at each declaration:
 *   - `'theme'` (`App.vue`) — a device preference, not account data; clearing it flashes the wrong
 *     colour scheme on the login screen the framework's top bar renders next.
 *   - `homeUiStore` — dashboard toggles (`hideDoneTodoList`/`hideDoneRoutine`), not account data.
 *   - `useTodayPlan`'s module state (`core/home/composable/useTodayPlan.ts`) — already resets itself
 *     via its own watcher on `currentUser.id`, which fires on this same transition.
 *   - Component-local refs scoped by `useUserScopedStorage` (pinned templates, template card order,
 *     the two activity-tracking hint dismissals) — they die with their component on navigation to
 *     the login route and are re-read from the (already account-scoped) storage key on remount.
 *
 * LIMIT: this clears in-memory and per-tab state. It does not scrub anything already rendered until
 * the next navigation, and a second tab is untouched — this is the floor, not a guarantee the next
 * account on this browser sees nothing of the last one.
 */
export function resetAppState(): void {
	useDayPlannerStore().resetStore()
	useTemplateDayPlannerStore().resetStore()
	useSecondaryTemplateDayPlannerStore().resetStore()
	useDayPlannerSettingsStore().resetSettings()
	useRoutineReviewStore().resetStore()
}

/** Convenience for callers that own both halves of a logout — see `authAdapter.ts`. */
export function logoutAndResetAppState(): void {
	useUserStore().logout()
	resetAppState()
}
