import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/HomeView.vue'
import { useAuth } from '@/_common/auth/authAdapter.ts'
import { hasRequiredRole, type RequiredRole } from '@/_common/nav/navTypes.ts'
import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
import { activityRoutes } from '@/core/activity/activity.routes.ts'
import { activityHistoryRoutes } from '@/core/activityHistory/activityHistory.routes.ts'
import { activityTrackingRoutes } from '@/core/activityTracking/activityTracking.routes.ts'
import { dayPlannerRoutes } from '@/core/dayPlanner/dayPlanner.routes.ts'
import { todoListRoutes } from '@/core/todoList/todoList.routes.ts'
import { leisureRoutes } from '@/core/leisure/leisure.routes.ts'
import { googleCalendarRoutes } from '@/core/googleCalendar/googleCalendar.routes.ts'
import { userRoutes } from '@/core/user/user.routes.ts'

declare module 'vue-router' {
	interface RouteMeta {
		/** Reachable while signed out. Everything else goes through the auth check below. */
		public?: boolean
		/**
		 * Lowest role allowed, mirroring the target view's own gating. This app has no role model,
		 * so the auth adapter answers `true` to all three getters and the check always passes —
		 * the key exists so vendored framework modules can carry it unmodified.
		 */
		requiredRole?: RequiredRole
		/** Show the floating reCAPTCHA v3 badge, toggled in `afterEach`. */
		showRecaptchaBadge?: boolean
	}
}

// Routes that belong to no feature module.
const commonRoutes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
	},
]

const router = createRouter({
	history: createWebHistory('/'),
	routes: [
		...commonRoutes,
		...userRoutes,
		...activityRoutes,
		...activityHistoryRoutes,
		...activityTrackingRoutes,
		...dayPlannerRoutes,
		...todoListRoutes,
		...leisureRoutes,
		...googleCalendarRoutes,
	],
})

const { hideFullScreenLoading } = useLoading()

router.beforeEach(to => {
	// Clear any spinner the outgoing view left behind, so a navigation can never strand the overlay.
	hideFullScreenLoading()

	if (to.meta.public === true) return true

	const auth = useAuth()
	if (!auth.isAuthenticated) return { name: 'login' }
	// Degrades to a no-op in this app (see the adapter's role getters); kept so route tables coming
	// from the framework keep their gating semantics.
	if (!hasRequiredRole(auth, to.meta.requiredRole)) return { name: 'home' }

	return true
})

router.afterEach(to => {
	const badge = document.querySelector('.grecaptcha-badge') as HTMLElement | null
	if (badge) {
		badge.style.visibility = to.meta.showRecaptchaBadge === true ? 'visible' : 'hidden'
	}
})

export default router
