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
					v-if="status !== undefined"
					:color="statusChipColor"
					size="small"
					density="compact"
				>
					{{ i18n.t(statusChipKey) }}
				</VChip>
			</div>
			<VBtn
				v-if="status?.configured"
				:color="status.connected ? 'errorDark' : 'primary'"
				:loading
				size="small"
				@click="toggle"
			>
				{{ i18n.t(status.connected ? 'googleCalendar.disconnect' : 'googleCalendar.connect') }}
			</VBtn>
		</div>
	</VCard>
</template>
<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useGoogleCalendarApi, type GoogleCalendarStatus } from '@/core/googleCalendar/api/googleCalendarApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	// Lifted out of the framework's SecuritySection when the user module moved into `_common`:
	// third-party account links are host-app concerns, so this renders into that section's
	// `#integrations` slot instead.
	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { getStatus, getAuthUrl, disconnect } = useGoogleCalendarApi()

	// Undefined until the status answers, so the chip does not flash "Not connected" on a deployment
	// where the integration is not available at all (`configured: false` — B14). No button is rendered
	// there either: the auth-url endpoint would answer 503, and that is not a failure to retry.
	const status = ref<GoogleCalendarStatus>()
	const loading = ref(false)

	const statusChipKey = computed(() => {
		if (!status.value?.configured) return 'googleCalendar.notAvailable'
		return status.value.connected ? 'googleCalendar.connected' : 'googleCalendar.notConnected'
	})
	const statusChipColor = computed(() => {
		if (!status.value?.configured) return 'textMuted'
		return status.value.connected ? 'success' : 'error'
	})

	getStatus().then(result => {
		status.value = result
	})

	async function toggle() {
		if (status.value === undefined) return
		loading.value = true
		try {
			if (status.value.connected) {
				await disconnect()
				status.value = { ...status.value, connected: false }
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
