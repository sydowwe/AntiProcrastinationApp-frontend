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
	</VApp>
</template>
<script setup lang="ts">
	import Snackbar from '@/components/general/feedback/Snackbar.vue'
	import LoadingFullscreen from '@/components/general/dialogs/LoadingFullscreen.vue'
	import Navbar from '@/components/nav/Navbar.vue'
	import { usePushNotifications } from '@/composables/general/UsePushNotifications.ts'

	const { initPushSupport } = usePushNotifications()
	initPushSupport()
</script>
<style scoped></style>
