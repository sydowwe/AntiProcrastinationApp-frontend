import { computed, type ComputedRef } from 'vue'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'

// The single read path for this app's own user preferences (`src/core/user/dto/userAugmentation.ts`).
//
// Both fields are absent from a fresh `new User()` — interface merging declares a type, it cannot
// create a value — so every consumer needs a fallback and every consumer must use the *same* one.
// Reading `currentUser.askBeforeDelete` directly is how five delete paths ended up written as
// `if (!askBeforeDelete) deleteImmediately()`, which is `true` for `undefined` — i.e. no
// confirmation at all on a device that had not yet opened the settings page.
//
// The framework now hydrates on the login path and, with `hydrateOnBoot`, on reload, so the window
// where these are absent is short — but it is not zero (neither call is awaited, and a failed fetch
// leaves the defaults standing for the session), and the computeds below are what make a late
// arrival change a preference rather than a decision already taken.
//
// Cross-module note: `todoList`, `dayPlanner` and `historyDashboard` import this. CLAUDE.md's rule
// is that cross-module imports go through `api/` or `dto/`, and this is a deliberate exception —
// the alternative is each module re-deriving the defaults, which is exactly the drift this fixes.
// `prompts/user/P1-two-settings-systems.md` owns the boundary decision; revisit it there.

// TODO(B3): both defaults below are the client's own choice, and neither has been confirmed against
// the server's. Whether `POST /user/data` even echoes these two fields back is also unverified —
// see `prompts/user/backend/B3-app-preference-round-trip.md`, which explains why the obvious
// "set it, reload, see if it sticks" check reports a false pass here (localStorage persistence plus
// an optimistic `Object.assign` in the store both mask a server that drops the key).

/** Absent means *ask*. An unknown preference must never be the reason a delete skips its dialog. */
export const ASK_BEFORE_DELETE_DEFAULT = true
/** Monday, matching `getWeekStart`'s own default in `_common/utils/DateTimeHelper.ts`. */
export const FIRST_DAY_OF_WEEK_DEFAULT: 0 | 1 = 1

export function useUserPreferences(): {
	askBeforeDelete: ComputedRef<boolean>
	firstDayOfWeek: ComputedRef<0 | 1>
} {
	const userStore = useUserStore()

	// Computed, not a plain read: hydration resolves after the first navigation, so anything holding
	// these must re-evaluate when the server's answer arrives.
	const askBeforeDelete = computed(() => userStore.currentUser.askBeforeDelete ?? ASK_BEFORE_DELETE_DEFAULT)
	const firstDayOfWeek = computed<0 | 1>(() => userStore.currentUser.firstDayOfWeek ?? FIRST_DAY_OF_WEEK_DEFAULT)

	return { askBeforeDelete, firstDayOfWeek }
}
