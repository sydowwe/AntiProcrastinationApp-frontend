<template>
	<div></div>
</template>

<script setup lang="ts">
	import { onMounted } from 'vue'
	import { useRoute } from 'vue-router'
	import { useGoogleCalendarApi } from '@/api/googleCalendarApi.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useI18n } from 'vue-i18n'
	import router from '@/plugins/router.ts'

	const route = useRoute()
	const { connect } = useGoogleCalendarApi()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()

	onMounted(async () => {
		const code = route.query.code as string | undefined
		if (!code) {
			showErrorSnackbar(t('googleCalendar.connectFailed'))
			router.replace({ name: 'userSettings' })
			return
		}
		try {
			await connect(code)
			showSuccessSnackbar(t('googleCalendar.connectSuccess'))
		} catch {
			showErrorSnackbar(t('googleCalendar.connectFailed'))
		}
		router.replace({ name: 'userSettings' })
	})
</script>
