import type { RouteRecordRaw } from 'vue-router'
import BacklogView from '@/core/leisure/view/BacklogView.vue'
import ProjectsView from '@/core/leisure/view/ProjectsView.vue'
import BucketListView from '@/core/leisure/view/BucketListView.vue'
import MemoryAnchorsView from '@/core/leisure/view/MemoryAnchorsView.vue'

export const leisureRoutes: RouteRecordRaw[] = [
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
