import { createApp } from 'vue'
import vue3GoogleLogin from 'vue3-google-login'
import App from './App.vue'
import router from './router.ts'
import i18n from './i18n.ts'
import { installFramework } from './_common/bootstrap/index.ts'
import { createAuthAdapter } from './core/user/authAdapter.ts'
import { useUserStore } from './_common/modules/user/store/authStore.ts'
// Side-effect only: merges this app's preference fields into the framework's User DTOs.
import './core/user/dto/userAugmentation.ts'
import { navItems } from './app/nav/navItems.ts'
import { notificationTypeMeta } from './app/notifications/notificationTypeMeta.ts'
import './assets/main.css'

const app = createApp(App)

// Installs Pinia, Vuetify, FontAwesome and auto-animate, and hands the framework its app-specific
// collaborators in the one order that works — see src/_common/SETUP.md §5. Two of those orderings
// fail at runtime rather than compile time, which is why this is a call and not a copy.
installFramework(app, {
	router,
	i18n,
	authAdapter: createAuthAdapter(),
	// A getter, not a value: the zone can change under a live session (see `syncBrowserTimeZone`
	// below), and every date and countdown must re-derive without a reload when it does. The server
	// resolves day boundaries in this same zone — that agreement is the whole point of reading it.
	userTimeZone: () => useUserStore().currentUser.timezone,
	// The zone is detected from the browser, never chosen: the user is where they are, and the UI
	// renders browser-local everywhere. `User.timezone` exists so the *server* can localize what it
	// sends, so its only job here is to stay equal to the device — re-checked on every hydration,
	// not just at sign-in.
	syncBrowserTimeZone: true,
	// `login()` fetches the user's record itself, so this covers only the other half: a returning
	// user whose persisted store says authenticated. Without it their preferences are a session old
	// — and on a first load in a new browser profile, constructor defaults.
	hydrateOnBoot: true,
	// Only `main` — the `customer` and `system` trees are for multi-tenant/admin apps and stay empty
	// here, which also keeps their section dividers and subheaders out of the sidebar.
	navTrees: { main: navItems },
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
