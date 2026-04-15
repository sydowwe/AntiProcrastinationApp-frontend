import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PomodoroTimerView from '@/views/addActivityHistory/PomodoroTimerView.vue'
import StopWatchView from '@/views/addActivityHistory/StopWatchView.vue'
import TimerView from '@/views/addActivityHistory/TimerView.vue'
import AlarmListView from '@/views/addActivityHistory/AlarmListView.vue'
import HistorySummaryView from '@/views/history/HistorySummaryView.vue'
import HistoryDetailView from '@/views/history/HistoryDetailView.vue'
import TodoListView from '@/views/todoList/TodoListView.vue'
import TodoListsView from '@/views/todoList/TodoListsView.vue'
import AddActivityManuallyView from '@/views/addActivityHistory/AddActivityManuallyView.vue'
import LoginView from '@/views/user/LoginView.vue'
import RegistrationView from '@/views/user/RegistrationView.vue'
import ForgottenPasswordView from '@/views/user/ForgottenPasswordView.vue'
import UserSettingsView from '@/views/user/UserSettingsView.vue'
import RoutineToDoListView from '@/views/todoList/RoutineToDoListView.vue'
import ConfirmEmailView from '@/views/user/ConfirmEmailView.vue'
import { useUserStore } from '@/stores/userStore'
import { useLoading } from '@/composables/general/LoadingComposable.ts'
// import DayPlannerView from '@/views/dayPlanner/DayPlannerView.vue';
import DayPlannerView from '@/views/dayPlanner/DayPlannerView.vue'
import TemplateDayPlannerView from '@/views/dayPlanner/TemplateDayPlannerView.vue'
import TemplateListView from '@/views/dayPlanner/TemplateListView.vue'
import TemplateSplitView from '@/views/dayPlanner/TemplateSplitView.vue'
import PlannerCalendarView from '@/views/dayPlanner/PlannerCalendarView.vue'
import ActivityDashboard from '@/views/tracker/ActivityDashboard.vue'
import HistoryCalendarView from '@/views/history/HistoryCalendarView.vue'
import DesktopSettingsView from '@/views/tracker/DesktopSettingsView.vue'
import ActivitySettingsView from '@/views/addActivityHistory/ActivitySettingsView.vue'
import RoutineSettingsView from '@/views/todoList/RoutineSettingsView.vue'
import DesktopActivityDashboard from '@/views/tracker/DesktopActivityDashboard.vue'
import AndroidActivityDashboard from '@/views/tracker/AndroidActivityDashboard.vue'

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
			path: '/activity-settings',
			name: 'activitySettings',
			component: ActivitySettingsView,
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
			path: '/activity-history/alarms',
			name: 'activityHistoryAlarms',
			component: AlarmListView,
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
const allowedRoutes = ['login', 'registration', 'termsAndConditions', 'confirmEmail', 'forgottenPassword']
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
