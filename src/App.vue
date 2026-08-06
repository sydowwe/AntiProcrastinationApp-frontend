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
	import DialogHost from '@/components/general/dialogs/DialogHost.vue'
	import Navbar from '@/_common/nav/Navbar.vue'
	import NotificationBell from '@/_common/modules/notifications/component/NotificationBell.vue'
	import { usePushNotifications } from '@/composables/general/UsePushNotifications.ts'
	import { useUserStore } from '@/core/user/store/authStore.ts'
	import type { ThemePreference } from '@/core/user/dto/response/User.ts'

	const { initPushSupport } = usePushNotifications()
	initPushSupport()

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
