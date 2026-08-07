// This app's own user-preference fields, merged into the framework's `User` / `UserPreferencesRequest`.
//
// The framework owns the generic identity and preference surface (e-mail, 2FA, theme, locale,
// timezone). These two flags are ours: `askBeforeDelete` gates the delete-confirmation dialog at six
// call sites, and `firstDayOfWeek` feeds the planner calendar. `User.fromJson` copies unknown keys
// through untouched, so both survive hydration without the framework knowing they exist.
//
// Import this file for its side effects once, in `main.ts` — the declarations are global.
import '@/_common/modules/user/dto/response/User.ts'
import '@/_common/modules/user/dto/request/UserPreferencesRequest.ts'

declare module '@/_common/modules/user/dto/response/User.ts' {
	interface User {
		firstDayOfWeek: 0 | 1
		askBeforeDelete: boolean
	}
}

declare module '@/_common/modules/user/dto/request/UserPreferencesRequest.ts' {
	interface UserPreferencesRequest {
		firstDayOfWeek?: 0 | 1
		askBeforeDelete?: boolean
	}
}

export {}
