<template>
	<VBtn
		type="button"
		variant="tonal"
		color="primaryOutline"
		size="large"
		block
		appendIcon="fa-brands fa-microsoft"
		@click="loginWithPopup"
	>
		{{ i18n.t('authorization.microsoftLogin') }}
	</VBtn>
</template>

<script setup lang="ts">
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useI18n } from 'vue-i18n'

	const emit = defineEmits<{
		(e: 'loggedIn', code: string): void
	}>()

	const i18n = useI18n()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()

	const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID
	const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID
	const appUrl = import.meta.env.VITE_APP_URL
	const redirectUri = encodeURIComponent(appUrl + '/entra-id-signin')
	const scopes = 'openid email profile offline_access'
	const domainHint = import.meta.env.VITE_ENTRA_DOMAIN_HINT

	function loginWithPopup() {
		showFullScreenLoading()

		const authUrl = (prompt: string) =>
			`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&prompt=${prompt}&domain_hint=${domainHint}`

		// First try silent login
		const popup = window.open(authUrl('none'), 'authPopup', 'width=600,height=600')
		let hasFallenBackToInteractive = false

		// Stop polling after ~2 minutes (240 * 500ms) so a stalled consent screen
		// can't leak the interval and the full-screen loader indefinitely.
		const pollIntervalMs = 500
		const maxAttempts = 240
		let attempts = 0

		function stopPolling() {
			clearInterval(checkPopup)
			hideFullScreenLoading()
		}

		const checkPopup = setInterval(() => {
			if (!popup || popup.closed) {
				stopPolling()
				return
			}

			if (++attempts > maxAttempts) {
				popup.close()
				stopPolling()
				return
			}

			try {
				const url = new URL(popup.location.href)
				const code = url.searchParams.get('code')
				const error = url.searchParams.get('error')

				if (code) {
					popup.close()
					clearInterval(checkPopup)
					emit('loggedIn', code)
					return
				}

				// Handle errors - fallback to interactive login
				if (error) {
					if (
						error === 'interaction_required' ||
						error === 'login_required' ||
						url.href.includes('AADSTS50058')
					) {
						if (!hasFallenBackToInteractive) {
							hasFallenBackToInteractive = true
							popup.location.href = authUrl('select_account')
						}
					} else {
						// Other errors
						console.error('Authentication error:', error)
						popup.close()
						stopPolling()
					}
				}
			} catch {
				// Cross-origin error - the popup is still on the Microsoft domain,
				// which we can't read. Keep polling until it redirects back to us.
			}
		}, pollIntervalMs)
	}
</script>

<style scoped></style>
