<template>
    <VApp>
        <Navbar></Navbar>
        <VMain>
            <VContainer class="h-100 d-flex" :fluid="true">
                <RouterView />
            </VContainer>
        </VMain>
        <Snackbar></Snackbar>
        <LoadingFullscreen></LoadingFullscreen>
    </VApp>
</template>
<script setup lang="ts">
	import Snackbar from '@/components/general/feedback/Snackbar.vue';
    import LoadingFullscreen from './components/dialogs/general/LoadingFullscreen.vue';
	import { useRecaptchaProvider } from 'vue-recaptcha'
	useRecaptchaProvider();
    import { importDefaults } from './compositions/general/Defaults';
	import {useI18n} from 'vue-i18n';
	import Navbar from '@/components/nav/Navbar.vue';
	const { router, userStore, showErrorSnackbar } = importDefaults();
	const i18n = useI18n();


</script>
<style scoped>

</style>
