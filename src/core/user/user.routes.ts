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
		// The framework's `RegistrationView.vue:41` hardcodes `<RouterLink to="/terms-and-conditions">`
		// on the "I agree to the terms" checkbox, and nothing routes that path — the framework's own
		// `TermsAndConditionsView` is deliberately unrouted. The link was therefore dead on the one
		// screen where the terms legally have to be readable *before* the user agrees to them. The
		// alias makes it resolve here without touching the submodule; see
		// `prompts/user/framework/F4-registration-terms-link.md` for the upstream ask.
		alias: '/terms-and-conditions',
		meta: { public: true },
	},
	{
		path: '/legal/privacy',
		name: 'legalPrivacy',
		component: PrivacyPolicyView,
		meta: { public: true },
	},
]
