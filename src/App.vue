<template>
	<VApp>
		<Navbar>
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
	import { usePushNotifications } from '@/_common/modules/notifications/composable/UsePushNotifications.ts'
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

	const { initPushSupport } = usePushNotifications()
	// Async since the framework version took it over: it now registers the service worker before
	// probing the existing subscription. Push support is optional, so a failure must not break boot.
	initPushSupport().catch(e => console.error('Push notification init failed:', e))

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
