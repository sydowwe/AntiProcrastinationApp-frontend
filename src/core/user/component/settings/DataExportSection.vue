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
	import { downloadBlob } from '@/_common/utils/fileDownload.ts'
	import SettingsSection from '@/core/user/component/settings/SettingsSection.vue'

	const i18n = useI18n()
	const { exportData } = useUserApi()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()

	async function onExport() {
		showFullScreenLoading()
		try {
			// The server names the file itself, stamping the date in the account's own timezone; the
			// fallback below is the same shape, so the two agree even if the header goes missing.
			const { blob, fileName } = await exportData(`antiprocrastination-export-${isoDateInUserZone()}.json`)
			downloadBlob(blob, fileName)
			showSuccessSnackbar(i18n.t('user.exportSuccess'))
		} catch {
			showErrorSnackbar(i18n.t('user.exportFailed'))
		} finally {
			hideFullScreenLoading()
		}
	}
</script>
