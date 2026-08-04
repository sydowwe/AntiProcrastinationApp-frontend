import type { AuthAdapter } from '@/_common/auth/authAdapter.ts'
// Points at the store's current location. Step 9 moves it to
// @/core/user/store/authStore.ts, at which point this import is the only thing that changes.
import { useUserStore } from '@/stores/userStore.ts'

// Binds this app's Pinia auth store to the framework's AuthAdapter contract.
//
// Every member resolves the store lazily on access, for two reasons: the adapter is created during
// bootstrap (before the store is first used, so hydration must not be forced here), and reading the
// reactive state at access time is what keeps `isAuthenticated` / `displayName` reactive inside the
// framework's nav templates.
export function createAuthAdapter(): AuthAdapter {
	return {
		get isAuthenticated() {
			return useUserStore().isAuthenticated
		},
		get displayName() {
			// This app's User carries no name fields — e-mail is the only human-readable identity.
			return useUserStore().currentUser.email
		},
		logout() {
			useUserStore().logout()
		},
		// This is a single-user productivity app with no role model: there is nothing to gate and
		// nobody to gate it from. The framework's RequiredRole vocabulary ('hr' | 'admin' |
		// 'rootAdmin') lives in `@/_common/nav/navTypes.ts`, which this project must not edit, so the
		// getters are satisfied with a constant `true`. `hasRequiredRole()` then passes for every
		// route, the router guard degrades to a plain authentication check, and the vendored modules
		// carrying `meta: { requiredRole: 'admin' }` (reminders, scheduler) stay reachable unmodified.
		//
		// If this app ever grows real roles, these three functions are the only thing that changes.
		isHrRole() {
			return true
		},
		isAdminRole() {
			return true
		},
		isRootAdmin() {
			return true
		},
	}
}
