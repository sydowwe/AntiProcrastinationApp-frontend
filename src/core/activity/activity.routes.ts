import type { RouteRecordRaw } from 'vue-router'
import ActivitySettingsView from '@/core/activity/view/ActivitySettingsView.vue'

export const activityRoutes: RouteRecordRaw[] = [
	{
		path: '/activity-settings',
		redirect: '/activity-settings/activities',
	},
	{
		path: '/activity-settings/:tab(activities|roles|categories)',
		name: 'activitySettings',
		component: ActivitySettingsView,
		props: true,
	},
]
