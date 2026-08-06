import type { RouteRecordRaw } from 'vue-router'
import SchedulerJobsView from '@/core/scheduler/view/SchedulerJobsView.vue'
import SchedulerJobDetailView from '@/core/scheduler/view/SchedulerJobDetailView.vue'
import SchedulerRunDetailView from '@/core/scheduler/view/SchedulerRunDetailView.vue'
import SchedulerNeedsAttentionView from '@/core/scheduler/view/SchedulerNeedsAttentionView.vue'

export const schedulerRoutes: RouteRecordRaw[] = [
	{
		path: '/planovac/ulohy',
		name: 'schedulerJobs',
		component: SchedulerJobsView,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/planovac/ulohy/:id(\\d+)',
		name: 'schedulerJobDetail',
		component: SchedulerJobDetailView,
		props: true,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/planovac/behy/:id(\\d+)',
		name: 'schedulerRunDetail',
		component: SchedulerRunDetailView,
		props: true,
		meta: { requiredRole: 'admin' },
	},
	{
		path: '/planovac/pozornost',
		name: 'schedulerNeedsAttention',
		component: SchedulerNeedsAttentionView,
		meta: { requiredRole: 'admin' },
	},
]
