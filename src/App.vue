<template>
	<VApp>
		<!-- First tab stop on every page: the framework's Navbar comes next in DOM order, so this is
			 the only place a skip link can precede the sidebar toggle. `d-sr-only-focusable` keeps it
			 out of sight until it has focus; the click is handled rather than left to the fragment so
			 the router never sees a `#main-content` hash navigation. -->
		<a
			href="#main-content"
			class="d-sr-only-focusable skip-link"
			@click.prevent="focusMainContent"
		>
			{{ $t('general.skipToContent') }}
		</a>
		<Navbar>
			<!-- No `v-if` on the bell: `AppTopBar` already renders this slot only when
				 `auth.isAuthenticated`, so a second guard here would be a copy of the framework's,
				 free to drift from it, and wrong for every other app in the family. -->
			<template #actions>
				<NotificationBell></NotificationBell>
			</template>
		</Navbar>
		<VMain
			id="main-content"
			ref="mainContent"
			tabindex="-1"
			style="height: 100dvh; overflow: hidden"
		>
			<VContainer
				class="h-100 d-flex py-0 px-2 px-md-3 overflow-y-auto"
				fluid
			>
				<RouterView></RouterView>
			</VContainer>
		</VMain>
		<Snackbar></Snackbar>
		<LoadingFullscreen></LoadingFullscreen>
		<DialogHost></DialogHost>
	</VApp>
</template>
<script setup lang="ts">
	import { useTemplateRef, watch } from 'vue'
	import { useTheme } from 'vuetify/framework'
	import { useI18n } from 'vue-i18n'
	import Snackbar from '@/_common/component/feedback/Snackbar.vue'
	import LoadingFullscreen from '@/_common/component/dialog/LoadingFullscreen.vue'
	import DialogHost from '@/_common/component/dialog/DialogHost.vue'
	import Navbar from '@/_common/nav/Navbar.vue'
	import NotificationBell from '@/_common/modules/notifications/component/NotificationBell.vue'
	import { startNotificationSession } from '@/_common/modules/notifications/composable/useNotifications.ts'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
	import type { ThemePreference } from '@/_common/modules/user/dto/response/User.ts'
	import { resetAppState } from '@/core/user/composable/useSessionReset.ts'
	import { useRunningTimerStore } from '@/core/activityHistory/store/runningTimerStore.ts'
	import { useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'

	// Created at boot rather than by whichever timer view happens to mount, because this store IS the
	// running timer's clock: it rehydrates the session, keeps counting, advances pomodoro phases and
	// rings the alarm. A page reloaded onto any other route has to bring a live session back with it,
	// or the countdown sits frozen until the user thinks to open a timer page and the alarm never
	// fires. One call — everything else it needs it does itself.
	useRunningTimerStore()

	// Binds the notification hub and the push state to the *session* rather than to the bell's mount,
	// for the same reason `useRunningTimerStore()` is called here: the state is module-level and
	// outlives every component that renders it, so something that lives as long as the tab has to
	// own its lifecycle. One idempotent call — it connects on sign-in, tears everything down on
	// sign-out, and does nothing at all while signed out. This used to be an unconditional
	// `initPushSupport()`, which registered the service worker and probed the push subscription for
	// a visitor sitting on the login screen.
	startNotificationSession()

	// Same reason as the two calls above: created at boot rather than by whichever picker mounts first.
	// The store exposes `ensureLoaded()`, so `createAppPinia()`'s plugin warms the role/category/activity
	// lists the moment it is created — they are read by pickers in five modules and change maybe weekly,
	// so waiting for a dialog to open only ever bought an empty dropdown for the first frame. The load
	// is a no-op while signed out, and creating the store here is also what arms its sign-in watcher, so
	// a second account in the same tab reloads rather than inheriting the first one's lists.
	useActivityOptionsStore()

	const userStore = useUserStore()
	const theme = useTheme()
	const i18n = useI18n()

	const mainContent = useTemplateRef<{ $el: HTMLElement }>('mainContent')

	// `<main>` carries `tabindex="-1"` so it can take focus without joining the tab order; the next
	// Tab then lands on the first control inside the view rather than back in the sidebar.
	function focusMainContent() {
		mainContent.value?.$el.focus()
	}

	function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
		if (preference === 'system') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
		}
		return preference
	}

	function applyPreferencesToUi() {
		// This runs unconditionally at boot (see the call below) and again on every deep change of
		// `userStore.currentUser` — including the replacement `hydrateFromServer()` does on sign-in.
		// Before sign-in, `currentUser` is the placeholder `new User()`, whose framework defaults are
		// hardcoded: `locale` to `AvailableLocales.SK` and `theme` to `'system'`. Writing either while
		// signed out stomps the app's own configured defaults before anything renders — SK over
		// `src/i18n.ts`'s `locale`, and the OS colour-scheme over `createAppVuetify`'s `defaultTheme`
		// ('dark'). So gate the whole block: once `isAuthenticated` flips true (set before
		// `hydrateFromServer()` runs), this watcher's next fire applies the real preferences, leaving
		// the signed-in path unaffected. Signed out, the theme is the Vuetify default unless AppTopBar
		// restores a deliberate toggle from `localStorage`.
		if (!userStore.isAuthenticated) return

		const resolved = resolveTheme(userStore.currentUser.theme)
		theme.change(resolved)
		// The framework's AppTopBar owns the theme toggle and re-reads this key in its own onMounted,
		// which runs after this setup. Seeding it keeps a stale value from overriding the server-side
		// preference on every page load.
		localStorage.setItem('theme', resolved)
		i18n.locale.value = userStore.currentUser.locale
	}

	applyPreferencesToUi()

	// The catch-all: every logout path ends here, including the one `authAdapter.logout()` cannot
	// see — `SecuritySection.vue` calls the framework store's `logout()` directly on e-mail change and
	// account deletion — and the axios interceptor's 401 handling. `authAdapter.logout()` also calls
	// `resetAppState()` directly (see its own comment); this watcher is what makes that redundant
	// rather than load-bearing.
	watch(
		() => userStore.isAuthenticated,
		(isAuthenticated, wasAuthenticated) => {
			if (wasAuthenticated && !isAuthenticated) resetAppState()
		},
	)

	watch(
		() => userStore.currentUser,
		() => applyPreferencesToUi(),
		{ deep: true },
	)

	// AppTopBar changes the Vuetify theme directly, so mirror a deliberate toggle back to the server —
	// the app-owned navbar used to do this through `setPreferences`. Re-applying the stored preference
	// above lands on the same value, so this watcher bails out and cannot loop.
	watch(
		() => theme.global.name.value,
		next => {
			if (next !== 'light' && next !== 'dark') return
			if (!userStore.isAuthenticated) return
			if (next === resolveTheme(userStore.currentUser.theme)) return
			// Failures already surface as a snackbar from the axios interceptor.
			userStore.setPreferences({ theme: next }).catch(() => {})
		},
	)
</script>
<style scoped>
	/* Only the focused state needs styling — `d-sr-only-focusable` handles the hidden one. Fixed so
	   it overlays the top bar instead of pushing the layout down for the one frame it is visible. */
	.skip-link:focus {
		position: fixed;
		top: 8px;
		left: 8px;
		z-index: 10000;
		padding: 8px 16px;
		border-radius: 8px;
		background: rgb(var(--v-theme-primary));
		color: rgb(var(--v-theme-on-primary));
		text-decoration: none;
	}

	/* Focus is moved here programmatically by the skip link; a focus ring around the whole main
	   region would be noise. */
	#main-content:focus {
		outline: none;
	}
</style>
