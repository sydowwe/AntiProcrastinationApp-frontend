import type { RouteRecordRaw } from 'vue-router'
import GoogleCalendarCallbackView from '@/core/googleCalendar/view/GoogleCalendarCallbackView.vue'

export const googleCalendarRoutes: RouteRecordRaw[] = [
	{
		path: '/google-calendar/callback',
		name: 'googleCalendarCallback',
		component: GoogleCalendarCallbackView,
	},
]
