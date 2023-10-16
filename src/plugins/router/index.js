import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../../views/StopWatchView.vue'
import CreateNewActivityView from '../../views/CreateNewActivityView.vue'
import StopWatchView from '../../views/StopWatchView.vue'
import TimerView from '../../views/TimerView.vue'
import AlarmView from '../../views/AlarmView.vue'
import HistoryView from '../../views/HistoryView.vue'
import ToDoListView from '../../views/ToDoListView.vue'
import AddActivityManuallyView from '../../views/AddActivityManuallyView.vue'
import LoginView from '../../views/LoginView.vue'
import RegistrationView from '../../views/RegistrationView.vue'
import TermsAndConditionsView from '../../views/TermsAndConditionsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/history',
      name: 'history',
      component: HistoryView
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
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router
