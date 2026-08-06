import type { RouteRecordRaw } from 'vue-router'
import PlannerCalendarView from '@/core/dayPlanner/view/PlannerCalendarView.vue'
import DayPlannerSettingsView from '@/core/dayPlanner/view/DayPlannerSettingsView.vue'
import DayPlannerView from '@/core/dayPlanner/view/DayPlannerView.vue'
import TemplateListView from '@/core/dayPlanner/view/TemplateListView.vue'
import TemplateSplitView from '@/core/dayPlanner/view/TemplateSplitView.vue'
import TemplateDayPlannerView from '@/core/dayPlanner/view/TemplateDayPlannerView.vue'

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
		props: true,
	},
]
