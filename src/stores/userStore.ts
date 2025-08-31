import {defineStore} from 'pinia';
import {ref, computed, readonly} from 'vue';


export const useUserStore = defineStore('user', () => {
	const userName = ref<string>('');
	const isAuthenticated = ref(false);
	const login = (name: string): void => {
		userName.value = name;
		isAuthenticated.value = true;
	};

	const logout = (): void => {
		userName.value = '';
		isAuthenticated.value = false;
	};

	return {
		userName,
		isAuthenticated,
		login,
		logout,
	};
})