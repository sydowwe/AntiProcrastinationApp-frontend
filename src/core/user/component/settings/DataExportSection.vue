<template>
	<SettingsSection :title="i18n.t('user.exportData')">
		<p class="text-medium-emphasis text-body-2 ma-0">{{ i18n.t('user.exportDataDescription') }}</p>
		<VBtn
			color="primary"
			prependIcon="download"
			@click="onExport"
		>
			{{ i18n.t('user.exportData') }}
		</VBtn>
	</SettingsSection>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { useUserApi } from '@/_common/modules/user/api/userApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'

	const i18n = useI18n()
	const { exportData } = useUserApi()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()

	async function onExport() {
		showFullScreenLoading()
		try {
			const blob = await exportData()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			// "Today" is an instant read: `toISOString()` names the UTC day, which is the wrong date in
			// the filename for anyone west of Greenwich in the evening. Cosmetic, but a one-word fix.
			a.download = `antiprocrastination-export-${isoDateInUserZone()}.json`
			a.click()
			URL.revokeObjectURL(url)
			showSuccessSnackbar(i18n.t('user.exportSuccess'))
		} catch {
			showErrorSnackbar(i18n.t('user.exportFailed'))
		} finally {
			hideFullScreenLoading()
		}
	}
</script>
