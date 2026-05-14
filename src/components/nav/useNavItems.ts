import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore.ts'
import router from '@/plugins/router.ts'

interface MenuItem {
	title: string
	icon: string
	to?: string
	needsAdmin: boolean
	children?: MenuItem[]
}

const items: MenuItem[] = [
	{ title: 'home', icon: 'home', to: '/', needsAdmin: false },
	{
		title: 'history',
		icon: 'clock-rotate-left',
		needsAdmin: false,
		children: [
			{ title: 'historySummary', icon: 'chart-pie', to: '/activity-history', needsAdmin: false },
			{ title: 'historyCalendar', icon: 'calendar', to: '/activity-history/calendar', needsAdmin: false },
		],
	},
	{
		title: 'activityTracking',
		icon: 'clock-rotate-left',
		needsAdmin: false,
		children: [
			{ title: 'activityTracking', icon: 'globe', to: '/activity-tracking', needsAdmin: false },
			{
				title: 'desktopSettings',
				icon: 'wrench',
				to: '/activity-tracking/desktop/settings/distinctEntries',
				needsAdmin: false,
			},
			{
				title: 'desktopActivityTracking',
				icon: 'desktop',
				to: '/activity-tracking/desktop',
				needsAdmin: false,
			},
			{
				title: 'androidActivityTracking',
				icon: 'fa-brands fa-android',
				to: '/activity-tracking/android',
				needsAdmin: false,
			},
			{
				title: 'androidSettings',
				icon: 'wrench',
				to: '/activity-tracking/android/settings/distinctEntries',
				needsAdmin: false,
			},
		],
	},
	{ title: 'activitySettings', icon: 'sliders', to: '/activity-settings/activities', needsAdmin: false },
	{
		title: 'toDoList',
		icon: 'list-check',
		needsAdmin: false,
		children: [
			{ title: 'toDoList', icon: 'list-check', to: '/todo-list', needsAdmin: false },
			{ title: 'routineToDoList', icon: 'rotate', to: '/routine-todo-list', needsAdmin: false },
		],
	},
	{
		title: 'recordActivity',
		icon: 'floppy-disk',
		needsAdmin: false,
		children: [
			{ title: 'recordActivityManually', icon: 'pen', to: '/activity-history/manual', needsAdmin: false },
			{ title: 'pomodoroTimer', icon: 'clock', to: '/activity-history/pomodoro', needsAdmin: false },
			{ title: 'stopwatch', icon: 'stopwatch', to: '/activity-history/stopwatch', needsAdmin: false },
			{ title: 'timer', icon: 'hourglass-end', to: '/activity-history/timer', needsAdmin: false },
		],
	},
	{
		title: 'taskPlanner',
		icon: 'calendar-days',
		needsAdmin: false,
		children: [
			{ title: 'dayPlanner', icon: 'calendar-days', to: '/day-planner', needsAdmin: false },
			{ title: 'templateDayPlanner', icon: 'calendar-day', to: '/day-planner/templates', needsAdmin: false },
			{ title: 'dayPlannerSettings', icon: 'gear', to: '/day-planner/settings', needsAdmin: false },
		],
	},
]

export type { MenuItem }

export function useNavItems() {
	const userStore = useUserStore()

	function filterMenuItem(item: MenuItem): MenuItem | null {
		if (item.children) {
			const filteredChildren = item.children
				.map(child => filterMenuItem(child))
				.filter(child => child !== null) as MenuItem[]

			if (filteredChildren.length === 0) return null

			return { ...item, children: filteredChildren }
		}
		return item
	}

	const filteredItems = computed(() =>
		items.map(item => filterMenuItem(item)).filter(item => item !== null) as MenuItem[],
	)

	function getAllMenuItems(menuItems: MenuItem[]): MenuItem[] {
		const result: MenuItem[] = []
		for (const item of menuItems) {
			if (item.to) result.push(item)
			if (item.children) result.push(...getAllMenuItems(item.children))
		}
		return result
	}

	const currentSite = computed(() => {
		const allItems = getAllMenuItems(filteredItems.value)
		return [...allItems].reverse().find(site => site.to && router.currentRoute.value.path.startsWith(site.to))
	})

	return { filteredItems, currentSite, userStore }
}
