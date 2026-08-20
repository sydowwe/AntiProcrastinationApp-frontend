import type { RouteRecordRaw } from 'vue-router'
import ActivityDashboard from '@/core/activityTracking/view/ActivityDashboard.vue'
import DesktopActivityDashboard from '@/core/activityTracking/view/DesktopActivityDashboard.vue'
import DesktopSettingsView from '@/core/activityTracking/view/DesktopSettingsView.vue'
import AndroidActivityDashboard from '@/core/activityTracking/view/AndroidActivityDashboard.vue'
import AndroidSettingsView from '@/core/activityTracking/view/AndroidSettingsView.vue'
import UnifiedActivityDashboard from '@/core/activityTracking/view/UnifiedActivityDashboard.vue'

export const activityTrackingRoutes: RouteRecordRaw[] = [
	{
		path: '/activity-tracking',
		name: 'activityTracking',
		component: ActivityDashboard,
	},
	// The merged view. A fourth dashboard, not a replacement — the three per-source ones stay, and
	// this one answers the question none of them can: what the day looked like across all of them.
	{
		path: '/activity-tracking/unified',
		name: 'unifiedActivityDashboard',
		component: UnifiedActivityDashboard,
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
