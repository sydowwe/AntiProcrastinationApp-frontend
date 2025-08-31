<template>
<VApp>
	<Navbar></Navbar>
	<VMain>
		<VContainer class="h-100 d-flex" :fluid="true" style="max-height: calc(100vh - 64px)">
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
