import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import vue3GoogleLogin from 'vue3-google-login'
import App from './App.vue'
import router from './router.ts'
import EN from './locales/EN'
import SK from './locales/SK'
import { installFramework } from './_common/bootstrap/index.ts'
import { createAuthAdapter } from './core/user/authAdapter.ts'
import { notificationTypeMeta } from './app/notifications/notificationTypeMeta.ts'
import './assets/main.css'

const app = createApp(App)

const i18n = createI18n({
	locale: 'SK',
	fallbackLocale: 'EN',
	messages: {
		SK,
		EN,
	},
})

// Installs Pinia, Vuetify, FontAwesome and auto-animate, and hands the framework its app-specific
// collaborators in the one order that works — see src/_common/SETUP.md §5. Two of those orderings
// fail at runtime rather than compile time, which is why this is a call and not a copy.
installFramework(app, {
	router,
	i18n,
	authAdapter: createAuthAdapter(),
	// This app renders its own Navbar (src/components/nav/), so the framework's nav trees stay empty.
	navTrees: {},
	notificationTypeMeta,
	vuetify: {
		// Only the hexes this app diverges from the shared design system on. The colour *names* are
		// the framework's and every component references them, so they must not be renamed here.
		themes: {
			dark: {
				colors: {
					background: '#121212',
					surface: '#202020',
					'secondary-accent': '#4C1D95',
					'primary-container': '#1d3257',
					'secondary-container': '#2A1F46',
					'on-primary-container': '#FFFFFF',
					'on-secondary-container': '#FFFFFF',
				},
			},
			light: {
				colors: {
					background: '#CCC',
					surface: '#EEE',
					'primary-accent': '#1E40AF',
					'secondary-accent': '#4C1D95',
					'primary-container': '#1B2A44',
					'secondary-container': '#2A1F46',
					warning: '#D97706',
					info: '#0284C7',
				},
			},
		},
	},
})

app.use(vue3GoogleLogin, {})

router.isReady().then(() => app.mount('#app'))
