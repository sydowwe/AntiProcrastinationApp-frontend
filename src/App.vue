<template>
<VApp>
	<Navbar></Navbar>
	<VMain style="height: 100dvh; overflow: hidden;">
		<VContainer class="h-100 d-flex pa-3 pa-md-4 overflow-y-auto" :fluid="true">
			<RouterView></RouterView>
		</VContainer>
	</VMain>
	<Snackbar></Snackbar>
	<LoadingFullscreen></LoadingFullscreen>
</VApp>
</template>
<script setup lang="ts">
import Snackbar from '@/components/general/feedback/Snackbar.vue';
import LoadingFullscreen from './components/dialogs/general/LoadingFullscreen.vue';
import Navbar from '@/components/nav/Navbar.vue';
</script>
<style scoped>

</style>
