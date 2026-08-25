<template>
	<VApp>
		<Navbar>
			<!-- No `v-if` on the bell: `AppTopBar` already renders this slot only when
				 `auth.isAuthenticated`, so a second guard here would be a copy of the framework's,
				 free to drift from it, and wrong for every other app in the family. -->
			<template #actions>
				<NotificationBell></NotificationBell>
			</template>
		</Navbar>
		<VMain style="height: 100dvh; overflow: hidden">
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
	import { watch } from 'vue'
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

	const userStore = useUserStore()
	const theme = useTheme()
	const i18n = useI18n()

	function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
		if (preference === 'system') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
		}
		return preference
	}

	function applyPreferencesToUi() {
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
<style scoped></style>
