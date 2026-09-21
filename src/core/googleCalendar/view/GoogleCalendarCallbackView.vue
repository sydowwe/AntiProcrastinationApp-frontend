<template>
	<div></div>
</template>

<script setup lang="ts">
	import { onMounted } from 'vue'
	import { useRoute } from 'vue-router'
	import axios from 'axios'
	import { useGoogleCalendarApi } from '@/core/googleCalendar/api/googleCalendarApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { ServerErrorType } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { extractServerErrorType } from '@/_common/axiosConfig.ts'
	import { useI18n } from 'vue-i18n'
	import router from '@/router.ts'

	const route = useRoute()
	const { connect } = useGoogleCalendarApi()
	const { showSuccessSnackbar, showErrorSnackbar, showSnackbar } = useSnackbar()
	const { t } = useI18n()

	// Google's redirect carries both `code` and the `state` the auth-url endpoint issued; the server
	// compares `state` with its cookie before it talks to Google, so either one missing is the same
	// failure as a rejected exchange (F33).
	function queryString(key: string): string | undefined {
		const value = route.query[key]
		return typeof value === 'string' && value.length > 0 ? value : undefined
	}

	// The connect request is `_silent`, so this is the only toast the user sees. The 400's
	// `errorType` says which of two things to do: a missing or mismatched state cookie means the
	// attempt expired and must be started over; Google refusing the code means try again. Anything
	// else keeps the generic wording. A replayed callback is `CookieMissing` too (the cookie is
	// consumed on the first connect), so never retry a 204 automatically.
	function connectFailureKey(e: unknown): string {
		if (!axios.isAxiosError(e) || e.response?.status !== 400) return 'googleCalendar.connectFailed'
		switch (extractServerErrorType(e)) {
			case ServerErrorType.CookieMissing:
			case ServerErrorType.BadRequest:
				return 'googleCalendar.connectExpired'
			case ServerErrorType.ExternalServiceError:
				return 'googleCalendar.connectRejected'
			default:
				return 'googleCalendar.connectFailed'
		}
	}

	onMounted(async () => {
		// `error=access_denied` is Google's own Cancel on the consent screen — the user's choice, not a
		// failure, so it gets its own softer wording. Any other `error` is the generic failure.
		if (queryString('error') === 'access_denied') {
			showSnackbar(t('googleCalendar.connectCancelled'), { color: 'warningDark' })
			router.replace({ name: 'userSettings' })
			return
		}
		const code = queryString('code')
		const state = queryString('state')
		if (code === undefined || state === undefined) {
			showErrorSnackbar(t('googleCalendar.connectFailed'))
			router.replace({ name: 'userSettings' })
			return
		}
		try {
			await connect(code, state)
			showSuccessSnackbar(t('googleCalendar.connectSuccess'))
		} catch (e) {
			showErrorSnackbar(t(connectFailureKey(e)))
		}
		router.replace({ name: 'userSettings' })
	})
</script>
