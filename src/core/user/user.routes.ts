import type { RouteRecordRaw } from 'vue-router'
import UserSettingsView from '@/core/user/view/UserSettingsView.vue'

// The signed-out auth routes (login, registration, forgotten password, e-mail confirmation) come
// from the framework's `userRoutes` — see `src/router.ts`. Only the settings route lives here,
// because its view fills the framework view's app-specific slots.
export const appUserRoutes: RouteRecordRaw[] = [
	{
		path: '/user/settings',
		name: 'userSettings',
		component: UserSettingsView,
	},
]
