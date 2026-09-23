import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/_common/auth/authAdapter.ts'
import { hasRequiredRole, type RequiredRole } from '@/_common/nav/navTypes.ts'
import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
import { homeRoutes } from '@/core/home/home.routes.ts'
import NotFoundView from '@/core/home/view/NotFoundView.vue'
import { activityRoutes } from '@/core/activity/activity.routes.ts'
import { activityHistoryRoutes } from '@/core/activityHistory/activityHistory.routes.ts'
import { activityTrackingRoutes } from '@/core/activityTracking/activityTracking.routes.ts'
import { dayPlannerRoutes } from '@/core/dayPlanner/dayPlanner.routes.ts'
import { todoListRoutes } from '@/core/todoList/todoList.routes.ts'
import { leisureRoutes } from '@/core/leisure/leisure.routes.ts'
import { googleCalendarRoutes } from '@/core/googleCalendar/googleCalendar.routes.ts'
// The signed-out auth views come from the framework; `/user/settings` stays app-side because its
// view fills the framework settings view's app-specific slots.
import { userRoutes } from '@/_common/modules/user/user.routes.ts'
import { appUserRoutes } from '@/core/user/user.routes.ts'
// Reminders and notifications ship from the framework submodule; scheduler is this app's own port
// of the same module. All three carry `meta: { requiredRole: 'admin' }` on their admin routes,
// which the guard below waves through — see the adapter's role getters.
import { remindersRoutes } from '@/_common/modules/reminders/reminders.routes.ts'
import { notificationsRoutes } from '@/_common/modules/notifications/notifications.routes.ts'
import { schedulerRoutes } from '@/_common/modules/scheduler/scheduler.routes.ts'

// The module's own defaults are English (`/scheduler/...`); this app keeps its pre-existing Slovak
// URLs by passing them explicitly here. src/app/nav/navItems.ts and both scheduler breadcrumb fixes
// resolve these routes by NAME, so this is the only place the paths themselves are declared.
const APP_SCHEDULER_PATHS = {
	jobs: '/planovac/ulohy',
	jobDetail: '/planovac/ulohy/:id(\\d+)',
	runDetail: '/planovac/behy/:id(\\d+)',
	needsAttention: '/planovac/pozornost',
}

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

const router = createRouter({
	history: createWebHistory('/'),
	routes: [
		...homeRoutes,
		...userRoutes,
		...appUserRoutes,
		...activityRoutes,
		...activityHistoryRoutes,
		...activityTrackingRoutes,
		...dayPlannerRoutes,
		...todoListRoutes,
		...leisureRoutes,
		...googleCalendarRoutes,
		...remindersRoutes,
		...notificationsRoutes,
		...schedulerRoutes(APP_SCHEDULER_PATHS),
		// The catch-all. It MUST stay last — declared before any spread it would shadow every route
		// after it. Deliberately not `public`: a signed-out visitor on an unknown URL still goes to
		// `/login`, and the `SIGNED_OUT_ONLY_ROUTES` bounce sends them to `/` afterwards.
		{
			path: '/:pathMatch(.*)*',
			name: 'notFound',
			component: NotFoundView,
		},
	],
})

const { hideFullScreenLoading } = useLoading()

/**
 * Public routes that a signed-in user has no business seeing, by route name — the framework owns the
 * route records, and a name is a plain string, so this crosses no module boundary.
 *
 * Not every public route belongs here, which is why `meta.public` alone cannot drive the redirect:
 * `/legal/terms` and `/legal/privacy` must stay readable while signed in, and the two confirm-e-mail
 * routes process a token out of an e-mailed link — bouncing those would break confirming an e-mail
 * change from the very session that requested it.
 */
const SIGNED_OUT_ONLY_ROUTES = new Set(['login', 'registration', 'forgottenPassword'])

router.beforeEach(to => {
	// Clear any spinner the outgoing view left behind, so a navigation can never strand the overlay.
	hideFullScreenLoading()

	if (to.meta.public === true) {
		// `isAuthenticated` is persisted to localStorage by the framework's auth store, so it is
		// already true here on a hard load — this fires before the session is re-hydrated from the
		// server, which is what makes the redirect work on a cold open of /login rather than only on
		// an in-app navigation.
		const auth = useAuth()
		if (auth.isAuthenticated && typeof to.name === 'string' && SIGNED_OUT_ONLY_ROUTES.has(to.name)) {
			return { name: 'home' }
		}
		return true
	}

	const auth = useAuth()
	// Carry the destination so signing in returns to it — the framework's `redirect` contract, the
	// same param its interceptor writes on a forced logout. Omitted for `/` to keep a plain bounce clean.
	if (!auth.isAuthenticated) {
		return { name: 'login', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } }
	}

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
