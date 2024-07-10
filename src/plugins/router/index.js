import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../../stores/userStore';
import HomeView from '../../views/activityHistory/StopWatchView.vue'
import CreateNewActivityView from '../../views/CreateNewActivityView.vue'
import StopWatchView from '../../views/activityHistory/StopWatchView.vue'
import TimerView from '../../views/activityHistory/TimerView.vue'
import AlarmView from '../../views/activityHistory/AlarmView.vue'
import HistoryView from '../../views/activityHistory/HistoryView.vue'
import ToDoListView from '../../views/ToDoListView.vue'
import AddActivityManuallyView from '../../views/activityHistory/AddActivityManuallyView.vue'
import LoginView from '../../views/user/LoginView.vue'
import RegistrationView from '../../views/user/RegistrationView.vue'
import ForgottenPasswordView from '../../views/user/ForgottenPasswordView.vue'
import TermsAndConditionsView from '../../views/user/TermsAndConditionsView.vue'
import UserSettingsView from '../../views/user/UserSettingsView.vue'
import RoutineToDoListView from '../../views/RoutineToDoListView.vue'
import PlannerView from '../../views/PlannerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/terms-and-conditions',
      name: 'termsAndConditions',
      component: TermsAndConditionsView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/registration',
      name: 'registration',
      component: RegistrationView
    },
    {
      path: '/forgotten-password',
      name: 'forgottenPassword',
      component: ForgottenPasswordView
    },
    {
      path: '/user-settings',
      name: 'userSettings',
      component: UserSettingsView
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView
    },
    {
      path: '/routine-to-do-list',
      name: 'routineToDoList',
      component: RoutineToDoListView
    },
    {
      path: '/to-do-list',
      name: 'toDoList',
      component: ToDoListView
    },
    {
      path: '/create-new-activity',
      name: 'createNewActivity',
      component: CreateNewActivityView
    },
    {
      path: '/stopwatch',
      name: 'stopwatch',
      component: StopWatchView
    },
    {
      path: '/timer',
      name: 'timer',
      component: TimerView
    },
    {
      path: '/alarm',
      name: 'alarm',
      component: AlarmView
    },
    {
      path: '/add-activity-manually',
      name: 'addActivityManually',
      component: AddActivityManuallyView
    },
    {
      path: '/planner',
      name: 'plannerView',
      component: PlannerView
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
});
const allowedRoutes = ['login','registration','termsAndConditions','forgottenPassword'];
router.beforeEach((to, from, next) => {
  if (!allowedRoutes.includes(to.name) && !useUserStore().getToken) {
    next('/login');
  } else {
    next();
  }
});
export default router
