import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../../views/StopWatchView.vue'
import CreateNewActivityView from '../../views/CreateNewActivityView.vue'
import StopWatchView from '../../views/StopWatchView.vue'
import TimerView from '../../views/TimerView.vue'
import HistoryView from '../../views/HistoryView.vue'
import ToDoListView from '../../views/ToDoListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView
    },
    {
      path: '/toDoList',
      name: 'toDoList',
      component: ToDoListView
    },
    {
      path: '/createNewActivity',
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
