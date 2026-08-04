<template>
	<VApp>
		<Navbar></Navbar>
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
	import Navbar from '@/components/nav/Navbar.vue'
	import { usePushNotifications } from '@/composables/general/UsePushNotifications.ts'
	import { useUserStore } from '@/stores/userStore.ts'

	const { initPushSupport } = usePushNotifications()
	initPushSupport()

	const userStore = useUserStore()
	const theme = useTheme()
	const i18n = useI18n()

	function applyPreferencesToUi() {
		const resolved =
			userStore.currentUser.theme === 'system'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: userStore.currentUser.theme
		theme.change(resolved)
		i18n.locale.value = userStore.currentUser.locale
	}

	applyPreferencesToUi()

	watch(
		() => userStore.currentUser,
		() => applyPreferencesToUi(),
		{ deep: true },
	)
</script>
<style scoped></style>
