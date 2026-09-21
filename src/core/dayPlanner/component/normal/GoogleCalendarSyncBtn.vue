<template>
	<VBtn
		v-if="configured && !store.isTemplateInPreview && calendarId !== undefined"
		:loading="loading"
		color="secondaryOutline"
		variant="tonal"
		@click="handleClick"
	>
		<VIcon
			icon="fab fa-google"
			size="16"
			class="mr-2"
		/>
		{{ connected ? t('googleCalendar.sync') : t('googleCalendar.connect') }}
	</VBtn>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { useGoogleCalendarApi } from '@/core/googleCalendar/api/googleCalendarApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useI18n } from 'vue-i18n'

	const { calendarId } = defineProps<{ calendarId?: number }>()

	const store = useDayPlannerStore()
	const { getStatus, getAuthUrl, syncDay } = useGoogleCalendarApi()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()

	// Hidden until the status answers `configured: true` — a deployment without a Google OAuth client
	// has nothing to connect or sync to (B14).
	const configured = ref(false)
	const connected = ref(false)
	const loading = ref(false)

	onMounted(async () => {
		const status = await getStatus()
		configured.value = status.configured
		connected.value = status.connected
	})

	async function handleClick() {
		loading.value = true
		try {
			if (!connected.value) {
				const url = await getAuthUrl()
				window.location.href = url
			} else {
				const count = await syncDay(calendarId!)
				// Named values first, plural count second — `t(key, plural, named)` is not an overload,
				// so the interpolated `{n}` was never filled in.
				showSuccessSnackbar(t('googleCalendar.syncSuccess', { n: count }, count))
			}
		} catch {
			showErrorSnackbar(t('googleCalendar.syncFailed'))
		} finally {
			loading.value = false
		}
	}
</script>
