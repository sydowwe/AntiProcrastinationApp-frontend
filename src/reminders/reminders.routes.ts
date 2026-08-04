import type { RouteRecordRaw } from 'vue-router'
import ReminderDefinitionsView from '@/core/reminders/view/ReminderDefinitionsView.vue'
import ReminderDefinitionDetailView from '@/core/reminders/view/ReminderDefinitionDetailView.vue'
import MyRemindersView from '@/core/reminders/view/MyRemindersView.vue'
import ReminderUpcomingView from '@/core/reminders/view/ReminderUpcomingView.vue'
import ReminderDispatchHistoryView from '@/core/reminders/view/ReminderDispatchHistoryView.vue'
import ReminderOverviewView from '@/core/reminders/view/ReminderOverviewView.vue'

export const remindersRoutes: RouteRecordRaw[] = [
	{
		path: '/pripomienky/register',
		name: 'reminderDefinitions',
		component: ReminderDefinitionsView,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/pripomienky/register/:id(\\d+)',
		name: 'reminderDefinitionDetail',
		component: ReminderDefinitionDetailView,
		props: true,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/pripomienky/moje',
		name: 'myReminders',
		component: MyRemindersView,
	},
	{
		path: '/pripomienky/nadchadzajuce',
		name: 'reminderUpcoming',
		component: ReminderUpcomingView,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/pripomienky/historia',
		name: 'reminderDispatchHistory',
		component: ReminderDispatchHistoryView,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/pripomienky/prehlad',
		name: 'reminderOverview',
		component: ReminderOverviewView,
		meta: { requiredRole: 'admin' },
	},
]
