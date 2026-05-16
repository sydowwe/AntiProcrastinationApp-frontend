<template>
	<VCard
		elevation="2"
		color="surface"
		class="pa-4 d-flex flex-column ga-3"
	>
		<h3>{{ i18n.t('user.exportData') }}</h3>
		<p class="text-medium-emphasis text-body-2 ma-0">{{ i18n.t('user.exportDataDescription') }}</p>
		<VBtn
			color="primary"
			prependIcon="download"
			@click="onExport"
		>
			{{ i18n.t('user.exportData') }}
		</VBtn>
	</VCard>
</template>
<script setup lang="ts">
	import { useI18n } from 'vue-i18n'
	import { useUserApi } from '@/api/userApi.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'

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
			a.download = `antiprocrastination-export-${new Date().toISOString().slice(0, 10)}.json`
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
