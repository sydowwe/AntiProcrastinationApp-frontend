import type { RouteRecordRaw } from 'vue-router'
import ActivityDashboard from '@/core/activityTracking/view/ActivityDashboard.vue'
import DesktopActivityDashboard from '@/core/activityTracking/view/DesktopActivityDashboard.vue'
import DesktopSettingsView from '@/core/activityTracking/view/DesktopSettingsView.vue'
import AndroidActivityDashboard from '@/core/activityTracking/view/AndroidActivityDashboard.vue'
import AndroidSettingsView from '@/core/activityTracking/view/AndroidSettingsView.vue'

export const activityTrackingRoutes: RouteRecordRaw[] = [
	{
		path: '/activity-tracking',
		name: 'activityTracking',
		component: ActivityDashboard,
	},
	{
		path: '/activity-tracking/desktop',
		name: 'desktopActivityDashboard',
		component: DesktopActivityDashboard,
	},
	{
		path: '/activity-tracking/desktop/settings/:tableView',
		name: 'desktopSettings',
		component: DesktopSettingsView,
	},
	{
		path: '/activity-tracking/android',
		name: 'androidActivityDashboard',
		component: AndroidActivityDashboard,
	},
	{
		path: '/activity-tracking/android/settings/:tableView',
		name: 'androidSettings',
		component: AndroidSettingsView,
	},
]
