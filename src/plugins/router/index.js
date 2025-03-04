import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CreateNewActivityView from '@/views/CreateNewActivityView.vue'
import PomodoroTimerView from "@/views/addActivityHistory/PomodoroTimerView.vue";
import StopWatchView from '@/views/addActivityHistory/StopWatchView.vue'
import TimerView from '@/views/addActivityHistory/TimerView.vue'
import AlarmListView from '@/views/addActivityHistory/AlarmListView.vue'
import HistoryView from '@/views/HistoryView.vue'
import ToDoListView from '@/views/ToDoListView.vue'
import AddActivityManuallyView from '@/views/addActivityHistory/AddActivityManuallyView.vue'
import LoginView from '@/views/user/LoginView.vue'
import RegistrationView from '@/views/user/RegistrationView.vue'
import ForgottenPasswordView from '@/views/user/ForgottenPasswordView.vue'
import TermsAndConditionsView from '@/views/user/TermsAndConditionsView.vue'
import UserSettingsView from '@/views/user/UserSettingsView.vue'
import RoutineToDoListView from '@/views/RoutineToDoListView.vue'
import PlannerView from '@/views/PlannerView.vue'
import ConfirmEmailView from "@/views/user/ConfirmEmailView.vue";
import {useLoadingStore} from '@/stores/globalFeedbackStores'
import {useUserStore} from "@/stores/userStore";


const router = createRouter({
    history: createWebHistory('/'),
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
            path: '/confirm-email',
            name: 'confirmEmail',
            component: ConfirmEmailView
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
            path: '/pomodoro-timer',
            name: 'pomodoroTimer',
            component: PomodoroTimerView
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
            path: '/alarm-list',
            name: 'alarmList',
            component: AlarmListView
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
const allowedRoutes = ['login', 'registration', 'termsAndConditions', 'confirmEmail','forgottenPassword'];
router.beforeEach((to, from, next) => {
    //useLoadingStore().showFullScreenLoading();
    if (!allowedRoutes.includes(to.name) && !useUserStore().isAuthenticated) {
        next('/login');
    } else {
        next();
    }
});
router.afterEach(() => {
    console.log('route')
    useLoadingStore().hideFullScreenLoading();
});

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
