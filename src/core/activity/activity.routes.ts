import type { RouteRecordRaw } from 'vue-router'
import ActivitySettingsView from '@/core/activity/view/ActivitySettingsView.vue'

export const activityRoutes: RouteRecordRaw[] = [
	{
		path: '/activity-settings/:tab?',
		name: 'activitySettings',
		component: ActivitySettingsView,
		props: true,
	},
]
