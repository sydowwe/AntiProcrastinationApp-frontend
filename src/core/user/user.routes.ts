import type { RouteRecordRaw } from 'vue-router'
import UserSettingsView from '@/core/user/view/UserSettingsView.vue'
import TermsView from '@/core/user/view/TermsView.vue'
import PrivacyPolicyView from '@/core/user/view/PrivacyPolicyView.vue'

// The signed-out auth routes (login, registration, forgotten password, e-mail confirmation) come
// from the framework's `userRoutes` — see `src/router.ts`. Only the settings route lives here,
// because its view fills the framework view's app-specific slots.
//
// `/legal/terms` and `/legal/privacy` are app-local rather than the framework's
// `TermsAndConditionsView` — that view's copy is placeholder text baked into its template (not
// locale-driven), so it cannot be reused without editing the submodule. Both are `public` so they
// are reachable before registration.
//
// The framework's registration checkbox links to both by route *name*, which `main.ts` hands it
// through `installFramework({ legalRoutes })` — so renaming a route here breaks that link, while
// changing a path does not.
export const appUserRoutes: RouteRecordRaw[] = [
	{
		path: '/user/settings',
		name: 'userSettings',
		component: UserSettingsView,
	},
	{
		path: '/legal/terms',
		name: 'legalTerms',
		component: TermsView,
		meta: { public: true },
	},
	{
		path: '/legal/privacy',
		name: 'legalPrivacy',
		component: PrivacyPolicyView,
		meta: { public: true },
	},
]
