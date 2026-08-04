import { defineStore } from 'pinia'
import type { LoggedInUser } from '@/core/user/dto/UserModel.ts'
import { UserRoleEnum } from '@/core/user/dto/UserModel.ts'
import { ref } from 'vue'
import { fetchAfterLogin } from '@/core/user/api/UserApi.ts'

export const useAuthStore = defineStore(
	'auth',
	() => {
		const loggedInUser = ref<LoggedInUser | null>(null)
		const isAuthenticated = ref(false)

		const emailFromRegistration = ref<string | undefined>()

		async function authenticated() {
			const data = await fetchAfterLogin()
			isAuthenticated.value = true
			loggedInUser.value = data
		}

		function logout() {
			isAuthenticated.value = false
			loggedInUser.value = null
		}

		function isHrRole(): boolean {
			const role = loggedInUser.value?.role
			return role === UserRoleEnum.Hr || role === UserRoleEnum.Admin || role === UserRoleEnum.RootAdmin
		}

		function isAdminRole(): boolean {
			const role = loggedInUser.value?.role
			return role === UserRoleEnum.Admin || role === UserRoleEnum.RootAdmin
		}

		function isRootAdmin(): boolean {
			return loggedInUser.value?.role === UserRoleEnum.RootAdmin
		}

		return {
			isAuthenticated,
			loggedInUser,
			emailFromRegistration,
			authenticated,
			logout,
			isHrRole,
			isAdminRole,
			isRootAdmin,
		}
	},
	{
		persist: {
			storage: localStorage,
			// Persist only the identity hint — never the transient registration hand-off.
			// The persisted role is a client-side hint for UI gating only; real enforcement
			// stays server-side and the identity is re-hydrated from the server on load.
			pick: ['isAuthenticated', 'loggedInUser'],
			afterHydrate: ctx => {
				if (ctx.store.isAuthenticated) {
					// Re-validate the persisted identity against the server on boot. Swallow failures here:
					// the axios interceptor owns auth errors (refresh / logout + redirect), and a transient
					// network error should leave the cached hint in place rather than throw unhandled.
					ctx.store.authenticated().catch(() => {})
				}
			},
		},
	},
)
