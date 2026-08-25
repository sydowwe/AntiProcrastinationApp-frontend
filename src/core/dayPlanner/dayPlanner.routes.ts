import type { RouteRecordRaw } from 'vue-router'
import PlannerCalendarView from '@/core/dayPlanner/view/PlannerCalendarView.vue'
import DayPlannerSettingsView from '@/core/dayPlanner/view/DayPlannerSettingsView.vue'
import DayPlannerView from '@/core/dayPlanner/view/DayPlannerView.vue'
import TemplateListView from '@/core/dayPlanner/view/TemplateListView.vue'
import TemplateSplitView from '@/core/dayPlanner/view/TemplateSplitView.vue'
import TemplateDayPlannerView from '@/core/dayPlanner/view/TemplateDayPlannerView.vue'
import PlannerTaskLinkView from '@/core/dayPlanner/view/PlannerTaskLinkView.vue'

export const dayPlannerRoutes: RouteRecordRaw[] = [
	{
		path: '/day-planner',
		name: 'plannerCalendar',
		component: PlannerCalendarView,
	},
	{
		path: '/day-planner/settings',
		name: 'dayPlannerSettings',
		component: DayPlannerSettingsView,
	},
	{
		// Two segments, so it can never be confused with `/day-planner/:date` below. Resolves a bare
		// task id to the dated planner URL that can show it — see the view for why the hop exists.
		path: '/day-planner/task/:id(\\d+)',
		name: 'dayPlannerTask',
		component: PlannerTaskLinkView,
	},
	{
		path: '/day-planner/:date',
		name: 'dayPlanner',
		component: DayPlannerView,
		props: true,
	},
	{
		path: '/day-planner/templates',
		name: 'dayPlannerTemplateList',
		component: TemplateListView,
	},
	{
		path: '/day-planner/templates/split',
		name: 'dayPlannerTemplateSplit',
		component: TemplateSplitView,
	},
	{
		path: '/day-planner/templates/:templateId',
		name: 'dayPlannerTemplate',
		component: TemplateDayPlannerView,
		// No `props: true`: the view's `templateId` prop is `number | null` and is how TemplateSplitView
		// feeds its two panels. Route params arrive as strings, so passing them through here would
		// shadow the prop with a string and break every numeric consumer downstream. The view reads the
		// param itself instead.
	},
]
