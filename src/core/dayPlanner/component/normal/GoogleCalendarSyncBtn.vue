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
				const { syncedCount, removedCount } = await syncDay(calendarId!)
				showSuccessSnackbar(syncMessage(syncedCount, removedCount))
			}
		} catch {
			showErrorSnackbar(t('googleCalendar.syncFailed'))
		} finally {
			loading.value = false
		}
	}

	// `{count}` as a named value is what vue-i18n picks the plural form from, which lets SK's
	// three-form rule apply. The removed clause appears only when the sync actually deleted something.
	function syncMessage(syncedCount: number, removedCount: number): string {
		const synced = t('googleCalendar.syncSuccess', { count: syncedCount })
		if (removedCount === 0) return synced
		const removed = t('googleCalendar.syncRemoved', { count: removedCount })
		return t('googleCalendar.syncSummary', { synced, removed })
	}
</script>
