import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
	'user',
	() => {
		const userName = ref<string>('')
		const isAuthenticated = ref(false)

		function login(name: string): void {
			userName.value = name
			isAuthenticated.value = true
		}

		function logout(): void {
			userName.value = ''
			isAuthenticated.value = false
		}

		return {
			userName,
			isAuthenticated,
			login,
			logout,
		}
	},
	{ persist: { storage: localStorage } },
)
