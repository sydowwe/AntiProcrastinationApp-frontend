import type { RouteRecordRaw } from 'vue-router'
import HistorySummaryView from '@/core/activityHistory/view/HistorySummaryView.vue'
import HistoryCalendarView from '@/core/activityHistory/view/HistoryCalendarView.vue'
import HistoryDetailView from '@/core/activityHistory/view/HistoryDetailView.vue'
import PomodoroTimerView from '@/core/activityHistory/component/PomodoroTimerView.vue'
import StopWatchView from '@/core/activityHistory/view/StopWatchView.vue'
import TimerView from '@/core/activityHistory/view/TimerView.vue'
import AddActivityManuallyView from '@/core/activityHistory/view/AddActivityManuallyView.vue'

export const activityHistoryRoutes: RouteRecordRaw[] = [
	{
		path: '/activity-history',
		name: 'activityHistory',
		component: HistorySummaryView,
	},
	{
		path: '/activity-history/calendar',
		name: 'activityHistoryCalendar',
		component: HistoryCalendarView,
	},
	{
		path: '/activity-history/detail',
		name: 'activityHistoryDetail',
		component: HistoryDetailView,
	},
	{
		path: '/activity-history/pomodoro',
		name: 'pomodoroTimer',
		component: PomodoroTimerView,
	},
	{
		path: '/activity-history/stopwatch',
		name: 'stopwatch',
		component: StopWatchView,
	},
	{
		path: '/activity-history/timer',
		name: 'timer',
		component: TimerView,
	},
	{
		path: '/activity-history/manual',
		name: 'activityHistoryManual',
		component: AddActivityManuallyView,
	},
]
