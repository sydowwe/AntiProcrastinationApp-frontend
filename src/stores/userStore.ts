import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from '@/dtos/response/user/User.ts'
import { useUserApi } from '@/api/userApi.ts'
import type { UserPreferencesRequest } from '@/dtos/request/user/UserPreferencesRequest.ts'

export const useUserStore = defineStore(
	'user',
	() => {
		const currentUser = ref<User>(new User())
		const isAuthenticated = ref(false)

		const userName = computed(() => currentUser.value.email)

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

		return { currentUser, isAuthenticated, userName, hydrateFromServer, setPreferences, login, logout }
	},
	{ persist: { storage: localStorage } },
)
