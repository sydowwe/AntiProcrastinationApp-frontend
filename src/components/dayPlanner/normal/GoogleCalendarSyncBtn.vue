<template>
	<VBtn
		v-if="!store.isTemplateInPreview && calendarId != null"
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
	import { useGoogleCalendarApi } from '@/api/googleCalendarApi.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useI18n } from 'vue-i18n'

	const { calendarId } = defineProps<{ calendarId?: number }>()

	const store = useDayPlannerStore()
	const { getStatus, getAuthUrl, syncDay } = useGoogleCalendarApi()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()

	const connected = ref(false)
	const loading = ref(false)

	onMounted(async () => {
		connected.value = await getStatus()
	})

	async function handleClick() {
		loading.value = true
		try {
			if (!connected.value) {
				const url = await getAuthUrl()
				window.location.href = url
			} else {
				const count = await syncDay(calendarId!)
				showSuccessSnackbar(t('googleCalendar.syncSuccess', count, { n: count }))
			}
		} catch {
			showErrorSnackbar(t('googleCalendar.syncFailed'))
		} finally {
			loading.value = false
		}
	}
</script>
