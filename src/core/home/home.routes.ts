import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/core/home/view/HomeView.vue'

// `home` imports components from other modules (RoutineTodoListItem, NormalTodoListItem,
// HistoryPieChart, TrackTimeDialog). That is a deliberate, accepted exception to the
// module-boundary rule: home is the app's composition layer and is allowed to be coupled to the
// modules it surfaces. Do not "fix" this or move those components into src/_common.
export const homeRoutes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
	},
]
