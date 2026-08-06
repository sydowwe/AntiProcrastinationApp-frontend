import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/HomeView.vue'
import PomodoroTimerView from '@/core/activityHistory/view/PomodoroTimerView.vue'
import StopWatchView from '@/core/activityHistory/view/StopWatchView.vue'
import TimerView from '@/core/activityHistory/view/TimerView.vue'
import HistorySummaryView from '@/core/activityHistory/view/HistorySummaryView.vue'
import HistoryDetailView from '@/core/activityHistory/view/HistoryDetailView.vue'
import TodoListView from '@/core/todoList/view/TodoListView.vue'
import TodoListsView from '@/core/todoList/view/TodoListsView.vue'
import AddActivityManuallyView from '@/core/activityHistory/view/AddActivityManuallyView.vue'
import LoginView from '@/core/user/view/LoginView.vue'
import RegistrationView from '@/core/user/view/RegistrationView.vue'
import ForgottenPasswordView from '@/core/user/view/ForgottenPasswordView.vue'
import UserSettingsView from '@/core/user/view/UserSettingsView.vue'
import RoutineToDoListView from '@/core/todoList/view/RoutineToDoListView.vue'
import ConfirmEmailView from '@/core/user/view/ConfirmEmailView.vue'
import ConfirmEmailChangeView from '@/core/user/view/ConfirmEmailChangeView.vue'
import { useUserStore } from '@/core/user/store/authStore'
import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
// import DayPlannerView from '@/core/dayPlanner/view/DayPlannerView.vue';
import DayPlannerView from '@/core/dayPlanner/view/DayPlannerView.vue'
import TemplateDayPlannerView from '@/core/dayPlanner/view/TemplateDayPlannerView.vue'
import TemplateListView from '@/core/dayPlanner/view/TemplateListView.vue'
import TemplateSplitView from '@/core/dayPlanner/view/TemplateSplitView.vue'
import PlannerCalendarView from '@/core/dayPlanner/view/PlannerCalendarView.vue'
import DayPlannerSettingsView from '@/core/dayPlanner/view/DayPlannerSettingsView.vue'
import ActivityDashboard from '@/core/activityTracking/view/ActivityDashboard.vue'
import HistoryCalendarView from '@/core/activityHistory/view/HistoryCalendarView.vue'
import DesktopSettingsView from '@/core/activityTracking/view/DesktopSettingsView.vue'
import ActivitySettingsView from '@/core/activity/view/ActivitySettingsView.vue'
import RoutineSettingsView from '@/core/todoList/view/RoutineSettingsView.vue'
import DesktopActivityDashboard from '@/core/activityTracking/view/DesktopActivityDashboard.vue'
import AndroidActivityDashboard from '@/core/activityTracking/view/AndroidActivityDashboard.vue'
import AndroidSettingsView from '@/core/activityTracking/view/AndroidSettingsView.vue'
import GoogleCalendarCallbackView from '@/core/googleCalendar/view/GoogleCalendarCallbackView.vue'
import BacklogView from '@/core/leisure/view/BacklogView.vue'
import ProjectsView from '@/core/leisure/view/ProjectsView.vue'
import BucketListView from '@/core/leisure/view/BucketListView.vue'
import MemoryAnchorsView from '@/core/leisure/view/MemoryAnchorsView.vue'

const router = createRouter({
	history: createWebHistory('/'),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/confirm-email',
			name: 'confirmEmail',
			component: ConfirmEmailView,
			meta: { showRecaptchaBadge: true },
		},
		{
			path: '/confirm-email-change',
			name: 'confirmEmailChange',
			component: ConfirmEmailChangeView,
			meta: { showRecaptchaBadge: true },
		},
		{
			path: '/login',
			name: 'login',
			component: LoginView,
			meta: { showRecaptchaBadge: true },
		},
		{
			path: '/registration',
			name: 'registration',
			component: RegistrationView,
			meta: { showRecaptchaBadge: true },
		},
		{
			path: '/forgotten-password',
			name: 'forgottenPassword',
			component: ForgottenPasswordView,
			meta: { showRecaptchaBadge: true },
		},
		{
			path: '/user/settings',
			name: 'userSettings',
			component: UserSettingsView,
		},
		{
			path: '/activity-settings/:tab?',
			name: 'activitySettings',
			component: ActivitySettingsView,
			props: true,
		},
		{
			path: '/routine-settings',
			name: 'routineSettings',
			component: RoutineSettingsView,
		},
		{
			path: '/activity-tracking/desktop/settings/:tableView',
			name: 'desktopSettings',
			component: DesktopSettingsView,
		},
		{
			path: '/activity-tracking/android/settings/:tableView',
			name: 'androidSettings',
			component: AndroidSettingsView,
		},
		{
			path: '/activity-tracking/desktop',
			name: 'desktopActivityDashboard',
			component: DesktopActivityDashboard,
		},
		{
			path: '/activity-tracking/android',
			name: 'androidActivityDashboard',
			component: AndroidActivityDashboard,
		},
		{
			path: '/activity-tracking',
			name: 'activityTracking',
			component: ActivityDashboard,
		},
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
			path: '/routine-todo-list',
			name: 'routineToDoList',
			component: RoutineToDoListView,
		},
		{
			path: '/todo-list',
			name: 'toDoList',
			component: TodoListsView,
		},
		{
			path: '/todo-list/:id',
			name: 'toDoListDetail',
			component: TodoListView,
			props: true,
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
		{
			path: '/google-calendar/callback',
			name: 'googleCalendarCallback',
			component: GoogleCalendarCallbackView,
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
		// {
		//   path: '/about',
		//   name: 'about',
		//   // route level code-splitting
		//   // this generates a separate chunk (About.[hash].js) for this route
		//   // which is lazy-loaded when the route is visited.
		//   component: () => import('../views/AboutView.vue')
		// }
	],
})

const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
const allowedRoutes = [
	'login',
	'registration',
	'termsAndConditions',
	'confirmEmail',
	'confirmEmailChange',
	'forgottenPassword',
]
router.beforeEach(to => {
	showFullScreenLoading()
	if (!allowedRoutes.includes(to.name?.toString() ?? '') && !useUserStore().isAuthenticated) {
		hideFullScreenLoading()
		return '/login'
	}
	hideFullScreenLoading()
})
router.afterEach(to => {
	const badge = document.querySelector('.grecaptcha-badge') as HTMLElement | null
	if (badge) {
		badge.style.visibility = to.meta.showRecaptchaBadge ? 'visible' : 'hidden'
	}
})

// const originalPush = router.push;
// router.push = async function (location) {
//     useLoadingStore().showFullScreenLoading();
//     try {
//         return await originalPush(location);
//     } catch (e) {
//         throw e;
//     } finally {
//         setTimeout(() => useLoadingStore().hideFullScreenLoading(), 1500)
//     }
// };
export default router
