import type { RouteRecordRaw } from 'vue-router'
import LoginView from '@/core/user/view/LoginView.vue'
import RegistrationView from '@/core/user/view/RegistrationView.vue'
import ForgottenPasswordView from '@/core/user/view/ForgottenPasswordView.vue'
import ConfirmEmailView from '@/core/user/view/ConfirmEmailView.vue'
import ConfirmEmailChangeView from '@/core/user/view/ConfirmEmailChangeView.vue'
import UserSettingsView from '@/core/user/view/UserSettingsView.vue'

// The five reachable-while-signed-out views all talk to reCAPTCHA-protected endpoints, hence the
// `public` + `showRecaptchaBadge` pairing. `userSettings` is the one authenticated route here.
export const userRoutes: RouteRecordRaw[] = [
	{
		path: '/login',
		name: 'login',
		component: LoginView,
		meta: { public: true, showRecaptchaBadge: true },
	},
	{
		path: '/registration',
		name: 'registration',
		component: RegistrationView,
		meta: { public: true, showRecaptchaBadge: true },
	},
	{
		path: '/forgotten-password',
		name: 'forgottenPassword',
		component: ForgottenPasswordView,
		meta: { public: true, showRecaptchaBadge: true },
	},
	{
		path: '/confirm-email',
		name: 'confirmEmail',
		component: ConfirmEmailView,
		meta: { public: true, showRecaptchaBadge: true },
	},
	{
		path: '/confirm-email-change',
		name: 'confirmEmailChange',
		component: ConfirmEmailChangeView,
		meta: { public: true, showRecaptchaBadge: true },
	},
	{
		path: '/user/settings',
		name: 'userSettings',
		component: UserSettingsView,
	},
]
