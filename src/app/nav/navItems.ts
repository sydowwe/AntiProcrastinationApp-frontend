import type { MenuItem } from '@/_common/nav/navTypes.ts'

// This app's menu, handed to the framework's sidebar shell at boot via `installFramework`'s
// `navTrees` option. It is data only: the filtering, active-state and rail behaviour that the old
// `useNavItems()` composable carried now live in `@/_common/nav/*`.
//
// No item carries `requiredRole` — this app has no role model (see `@/core/user/authAdapter.ts`),
// so every item is visible to every signed-in user. `title` is an i18n key under `navigation.*`.
export const navItems: MenuItem[] = [
	{ title: 'home', icon: 'home', to: '/' },
	{
		title: 'history',
		icon: 'clock-rotate-left',
		children: [
			{ title: 'historySummary', icon: 'chart-pie', to: '/activity-history' },
			{ title: 'historyCalendar', icon: 'calendar', to: '/activity-history/calendar' },
		],
	},
	{
		title: 'activityTracking',
		icon: 'clock-rotate-left',
		children: [
			{ title: 'activityTracking', icon: 'globe', to: '/activity-tracking' },
			{ title: 'desktopSettings', icon: 'wrench', to: '/activity-tracking/desktop/settings/distinctEntries' },
			{ title: 'desktopActivityTracking', icon: 'desktop', to: '/activity-tracking/desktop' },
			{ title: 'androidActivityTracking', icon: 'fa-brands fa-android', to: '/activity-tracking/android' },
			{ title: 'androidSettings', icon: 'wrench', to: '/activity-tracking/android/settings/distinctEntries' },
		],
	},
	{ title: 'activitySettings', icon: 'sliders', to: '/activity-settings/activities' },
	{
		title: 'toDoList',
		icon: 'list-check',
		children: [
			{ title: 'toDoList', icon: 'list-check', to: '/todo-list' },
			{ title: 'routineToDoList', icon: 'rotate', to: '/routine-todo-list' },
		],
	},
	{
		title: 'recordActivity',
		icon: 'floppy-disk',
		children: [
			{ title: 'recordActivityManually', icon: 'pen', to: '/activity-history/manual' },
			{ title: 'pomodoroTimer', icon: 'clock', to: '/activity-history/pomodoro' },
			{ title: 'stopwatch', icon: 'stopwatch', to: '/activity-history/stopwatch' },
			{ title: 'timer', icon: 'hourglass-end', to: '/activity-history/timer' },
		],
	},
	{
		title: 'taskPlanner',
		icon: 'calendar-days',
		children: [
			{ title: 'dayPlanner', icon: 'calendar-days', to: '/day-planner' },
			{ title: 'templateDayPlanner', icon: 'calendar-day', to: '/day-planner/templates' },
			{ title: 'dayPlannerSettings', icon: 'gear', to: '/day-planner/settings' },
		],
	},
	{
		title: 'leisure',
		icon: 'umbrella-beach',
		children: [
			{ title: 'backlog', icon: 'box-archive', to: '/leisure/backlog' },
			{ title: 'projects', icon: 'screwdriver-wrench', to: '/leisure/projects' },
			{ title: 'bucketList', icon: 'star', to: '/leisure/bucket-list' },
			{ title: 'memoryAnchors', icon: 'anchor', to: '/leisure/memory-anchors' },
		],
	},
]
