import { computed, type ComputedRef } from 'vue'
import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
import { Time } from '@/_common/dto/dto/Time.ts'

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
// Cross-module note: `todoList`, `dayPlanner`, `historyDashboard` and `leisure` import this. CLAUDE.md's rule
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
/** 08:00 and midnight: the server's own defaults (`UserSleepWindow.Fallback`), so an unhydrated read agrees with it. */
export const DEFAULT_WAKE_UP_TIME_DEFAULT = { hours: 8, minutes: 0 }
export const DEFAULT_BED_TIME_DEFAULT = { hours: 0, minutes: 0 }
/** P2-01. The server's own defaults: the briefing is on, sent right at wake-up. Absent is *on*, never off. */
export const MORNING_BRIEFING_ENABLED_DEFAULT = true
export const MORNING_BRIEFING_OFFSET_MINUTES_DEFAULT = 0

export function useUserPreferences(): {
	askBeforeDelete: ComputedRef<boolean>
	firstDayOfWeek: ComputedRef<0 | 1>
	weatherLocation: ComputedRef<string | null>
	defaultWakeUpTime: ComputedRef<Time>
	defaultBedTime: ComputedRef<Time>
	morningBriefingEnabled: ComputedRef<boolean>
	morningBriefingOffsetMinutes: ComputedRef<number>
} {
	const userStore = useUserStore()

	// Computed, not a plain read: hydration resolves after the first navigation, so anything holding
	// these must re-evaluate when the server's answer arrives.
	const askBeforeDelete = computed(() => userStore.currentUser.askBeforeDelete ?? ASK_BEFORE_DELETE_DEFAULT)
	const firstDayOfWeek = computed<0 | 1>(() => userStore.currentUser.firstDayOfWeek ?? FIRST_DAY_OF_WEEK_DEFAULT)
	// No default to choose here: unset is `null`, as the server sends it. The blank string is folded
	// into it because the store's optimistic `Object.assign` leaves `''` behind after a clear, while
	// the server stores that same clear as `null`.
	const weatherLocation = computed(() => userStore.currentUser.weatherLocation?.trim() || null)
	// FO10. Through `Time.fromJson` because the stored value is a plain `{hours, minutes}` after a reload
	// (the store persists to localStorage) and a `Time` after an optimistic `setPreferences`.
	const defaultWakeUpTime = computed(() =>
		Time.fromJson(userStore.currentUser.defaultWakeUpTime ?? DEFAULT_WAKE_UP_TIME_DEFAULT),
	)
	const defaultBedTime = computed(() =>
		Time.fromJson(userStore.currentUser.defaultBedTime ?? DEFAULT_BED_TIME_DEFAULT),
	)
	const morningBriefingEnabled = computed(
		() => userStore.currentUser.morningBriefingEnabled ?? MORNING_BRIEFING_ENABLED_DEFAULT,
	)
	const morningBriefingOffsetMinutes = computed(
		() => userStore.currentUser.morningBriefingOffsetMinutes ?? MORNING_BRIEFING_OFFSET_MINUTES_DEFAULT,
	)

	return {
		askBeforeDelete,
		firstDayOfWeek,
		weatherLocation,
		defaultWakeUpTime,
		defaultBedTime,
		morningBriefingEnabled,
		morningBriefingOffsetMinutes,
	}
}
