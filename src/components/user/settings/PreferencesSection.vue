<template>
	<VCard
		elevation="2"
		color="surface"
		class="pa-4 d-flex flex-column ga-2"
	>
		<h3>{{ i18n.t('user.preferences') }}</h3>
		<VSwitch
			:modelValue="userStore.currentUser.askBeforeDelete"
			:label="i18n.t('user.askBeforeDelete')"
			color="primary"
			hideDetails
			density="compact"
			@update:modelValue="onAskBeforeDeleteChange"
		/>
	</VCard>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/stores/userStore.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { handleHttpCodes } from '@/composables/general/ErrorHandlingFunctions.ts'

	const i18n = useI18n()
	const userStore = useUserStore()
	const { showSuccessSnackbar } = useSnackbar()

	async function onAskBeforeDeleteChange(v: boolean) {
		try {
			await userStore.setPreferences({ askBeforeDelete: v })
			showSuccessSnackbar(i18n.t('user.preferenceSaved'))
		} catch (e: any) {
			handleHttpCodes(e.response?.status)
		}
	}
</script>
