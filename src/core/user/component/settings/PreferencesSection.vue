<template>
	<SettingsSection :title="i18n.t('user.preferences')">
		<VSwitch
			:modelValue="askBeforeDelete"
			:label="i18n.t('user.askBeforeDelete')"
			color="primary"
			hideDetails
			density="compact"
			@update:modelValue="onAskBeforeDeleteChange"
		/>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { useUserStore } from '@/_common/modules/user/store/authStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { handleHttpCodes } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'

	const i18n = useI18n()
	const userStore = useUserStore()
	// Through the composable, so the switch shows the same value the delete paths act on — an
	// unhydrated `undefined` would otherwise render "off" while the app is really asking.
	const { askBeforeDelete } = useUserPreferences()
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
