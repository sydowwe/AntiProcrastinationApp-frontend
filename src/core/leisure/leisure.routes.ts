import type { RouteRecordRaw } from 'vue-router'
import BacklogView from '@/core/leisure/view/BacklogView.vue'
import ProjectsView from '@/core/leisure/view/ProjectsView.vue'
import BucketListView from '@/core/leisure/view/BucketListView.vue'
import MemoryAnchorsView from '@/core/leisure/view/MemoryAnchorsView.vue'
import PickerView from '@/core/leisure/view/PickerView.vue'

export const leisureRoutes: RouteRecordRaw[] = [
	{
		// The fifth leisure route, and the only one that is not a table: it spends what the other four
		// collect. Their routes are untouched.
		path: '/leisure/pick',
		name: 'leisurePicker',
		component: PickerView,
	},
	{
		path: '/leisure/backlog',
		name: 'leisureBacklog',
		component: BacklogView,
	},
	{
		path: '/leisure/projects',
		name: 'leisureProjects',
		component: ProjectsView,
	},
	{
		path: '/leisure/bucket-list',
		name: 'leisureBucketList',
		component: BucketListView,
	},
	{
		path: '/leisure/memory-anchors',
		name: 'leisureMemoryAnchors',
		component: MemoryAnchorsView,
	},
]
