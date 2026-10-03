// This app's own user-preference fields, merged into the framework's `User` / `UserPreferencesRequest`.
//
// The framework owns the generic identity and preference surface (e-mail, 2FA, theme, locale,
// timezone). These two flags are ours: `askBeforeDelete` gates the delete-confirmation dialog at
// five call sites (todo lists, todo-list categories, plan templates, planner tasks, history
// entries), and `firstDayOfWeek` is set from `PreferencesSection.vue` and read by
// `useRoutineWeeklyReview.ts`. It does *not* feed the planner calendar, which is
// `_common/component/calendar/CalendarGrid.vue` and is hardcoded to ISO weeks via
// `getISOWeekStart` — see `prompts/user/framework/F5-calendar-week-start.md`. `User.fromJson`
// copies unknown keys through untouched, so both survive hydration without the framework knowing
// they exist.
//
// `weatherLocation` is the third (OP4): free text, set from `PreferencesSection.vue` and read only
// by the server, which geocodes it for `GET /leisure-weather-fit`. The client reads it back just to
// show the input and to decide whether `/leisure/pick` shows its "set your location" hint. The wire
// convention is asymmetric: the response carries `null` when unset, but the request treats `null`
// (or an absent key) as "leave unchanged" and `''` as "clear", so the request side is `string` only.
//
// All three are **optional on the response side**, and that is load-bearing rather than defensive.
// Interface merging declares a type; it cannot create a value, so neither field exists on a fresh
// `new User()` — which is what the store holds until `hydrateFromServer()` resolves (from `login()`
// on sign-in, from `installFramework({ hydrateOnBoot: true })` on reload; neither is awaited).
// Declaring them non-optional made that absence invisible and let five call sites be written as
// `if (!currentUser.askBeforeDelete) deleteImmediately()`. Optional forces every consumer through
// `core/user/composable/useUserPreferences.ts`, which supplies the safe defaults in one place.
//
// Import this file for its side effects once, in `main.ts` — the declarations are global.
import '@/_common/modules/user/dto/response/User.ts'
import '@/_common/modules/user/dto/request/UserPreferencesRequest.ts'

declare module '@/_common/modules/user/dto/response/User.ts' {
	interface User {
		firstDayOfWeek?: 0 | 1
		askBeforeDelete?: boolean
		weatherLocation?: string | null
	}
}

declare module '@/_common/modules/user/dto/request/UserPreferencesRequest.ts' {
	interface UserPreferencesRequest {
		firstDayOfWeek?: 0 | 1
		askBeforeDelete?: boolean
		weatherLocation?: string
	}
}

export {}
