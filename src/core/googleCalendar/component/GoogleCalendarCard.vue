<template>
	<VCard
		variant="outlined"
		color="secondaryOutline"
		class="pa-3"
	>
		<div class="d-flex justify-space-between align-center">
			<div class="d-flex align-center ga-2">
				<VIcon icon="fab fa-google" />
				<span>{{ i18n.t('googleCalendar.title') }}</span>
				<VChip
					:color="connected ? 'success' : 'error'"
					size="small"
					density="compact"
				>
					{{ i18n.t(connected ? 'googleCalendar.connected' : 'googleCalendar.notConnected') }}
				</VChip>
			</div>
			<VBtn
				:color="connected ? 'error' : 'primary'"
				:loading
				size="small"
				@click="toggle"
			>
				{{ i18n.t(connected ? 'googleCalendar.disconnect' : 'googleCalendar.connect') }}
			</VBtn>
		</div>
	</VCard>
</template>
<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useGoogleCalendarApi } from '@/core/googleCalendar/api/googleCalendarApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	// Lifted out of the framework's SecuritySection when the user module moved into `_common`:
	// third-party account links are host-app concerns, so this renders into that section's
	// `#integrations` slot instead.
	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { getStatus, getAuthUrl, disconnect } = useGoogleCalendarApi()

	const connected = ref(false)
	const loading = ref(false)

	getStatus().then(isConnected => {
		connected.value = isConnected
	})

	async function toggle() {
		loading.value = true
		try {
			if (connected.value) {
				await disconnect()
				connected.value = false
				showSuccessSnackbar(i18n.t('googleCalendar.disconnectSuccess'))
			} else {
				const url = await getAuthUrl()
				window.location.href = url
			}
		} catch {
			showErrorSnackbar(i18n.t('googleCalendar.connectFailed'))
		} finally {
			loading.value = false
		}
	}
</script>
