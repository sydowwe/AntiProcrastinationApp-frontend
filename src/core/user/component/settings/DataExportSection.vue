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
			const blob = await exportData()
			// `useUserApi().exportData()` returns a bare Blob and discards response headers (framework
			// code, not editable here), so the server's Content-Disposition filename never reaches us —
			// this is always the fallback name, not a fallback for a missing header.
			// TODO(B1): prompts/user/backend/B1-export-filename.md
			downloadBlob(blob, `antiprocrastination-export-${isoDateInUserZone()}.json`)
			showSuccessSnackbar(i18n.t('user.exportSuccess'))
		} catch {
			showErrorSnackbar(i18n.t('user.exportFailed'))
		} finally {
			hideFullScreenLoading()
		}
	}
</script>
