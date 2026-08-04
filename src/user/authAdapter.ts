import type { AuthAdapter } from '@/_common/auth/authAdapter.ts'
import { useAuthStore } from '@/core/user/store/authStore.ts'

// Binds this app's Pinia auth store to the framework's AuthAdapter contract.
//
// Every member resolves the store lazily on access, for two reasons: the adapter is created during
// bootstrap (before the store is first used, so hydration must not be forced here), and reading the
// reactive state at access time is what keeps `isAuthenticated` / `displayName` reactive inside the
// framework's nav templates.
export function createAuthAdapter(): AuthAdapter {
	return {
		get isAuthenticated() {
			return useAuthStore().isAuthenticated
		},
		get displayName() {
			return useAuthStore().loggedInUser?.fullName
		},
		logout() {
			useAuthStore().logout()
		},
		isHrRole() {
			return useAuthStore().isHrRole()
		},
		isAdminRole() {
			return useAuthStore().isAdminRole()
		},
		isRootAdmin() {
			return useAuthStore().isRootAdmin()
		},
	}
}
