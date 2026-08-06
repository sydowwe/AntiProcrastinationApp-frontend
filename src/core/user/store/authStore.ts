import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from '@/core/user/dto/response/User.ts'
import { useUserApi } from '@/core/user/api/userApi.ts'
import type { UserPreferencesRequest } from '@/core/user/dto/request/UserPreferencesRequest.ts'

export const useUserStore = defineStore(
	'user',
	() => {
		const currentUser = ref<User>(new User())
		const isAuthenticated = ref(false)

		const userName = computed(() => currentUser.value.email)

		// The name the framework's auth contract uses for the signed-in user (see _common/SETUP.md).
		// Kept as an alias rather than a rename so this app's own 17 `currentUser` call sites stand.
		const loggedInUser = computed(() => currentUser.value)

		const { fetchUserData, updatePreferences } = useUserApi()

		async function hydrateFromServer(): Promise<void> {
			currentUser.value = await fetchUserData()
		}

		async function setPreferences(partial: UserPreferencesRequest): Promise<void> {
			await updatePreferences(partial)
			Object.assign(currentUser.value, partial)
		}

		function login(email?: string): void {
			if (email) currentUser.value.email = email
			isAuthenticated.value = true
		}

		function logout(): void {
			currentUser.value = new User()
			isAuthenticated.value = false
		}

		return {
			currentUser,
			loggedInUser,
			isAuthenticated,
			userName,
			hydrateFromServer,
			setPreferences,
			login,
			logout,
		}
	},
	{ persist: { storage: localStorage } },
)
