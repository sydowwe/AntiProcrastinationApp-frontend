<template>
	<VBtn
		width="100%"
		color="primary"
		:disabled="loading"
		@click="signIn"
	>
		{{ $t('authorization.continueWithGoogle') }}
		<VIcon class="ml-1"></VIcon>
	</VBtn>
	<div
		v-if="error"
		class="error-message"
	>
		{{ $t('authorization.googleLoginError') }}
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { GoogleSignInRequest } from '@/dtos/request/user/GoogleSignInRequest.ts'
	import { googleSdkLoaded } from 'vue3-google-login'
	import { API } from '@/plugins/axiosConfig.ts'
	import { useRecaptcha } from '@/composables/UseRecaptchaHandler.ts'

	const { isStayLoggedIn } = defineProps<{
		isStayLoggedIn: boolean
	}>()

	const emit = defineEmits<{
		loggedIn: [email: string, currentLocale: string]
	}>()

	const { executeRecaptcha } = useRecaptcha()

	const loading = ref(false)
	const error = ref(false)
	const clientId = import.meta.env.VITE_GOOGLE_LOGIN_CLIENT_ID

	function signIn() {
		googleSdkLoaded(google => {
			google.accounts.oauth2
				.initCodeClient({
					client_id: clientId,
					scope: 'email openid',
					ux_mode: 'popup',
					callback: handleCode,
				})
				.requestCode()
		})
	}

	async function handleCode(response: { code: string }) {
		loading.value = true
		error.value = false

		let loginData: { email: string; currentLocale: string } | null = null

		try {
			const recaptchaToken = await executeRecaptcha('google_sign_in')

			if (recaptchaToken) {
				const request = new GoogleSignInRequest(
					isStayLoggedIn,
					recaptchaToken,
					Intl.DateTimeFormat().resolvedOptions().timeZone,
					response.code,
				)

				const apiResponse = await API.post('/auth/login/google', request)
				loginData = { email: apiResponse.data.email, currentLocale: apiResponse.data.currentLocale }
			}
		} catch (err) {
			console.error(err)
			error.value = true
		} finally {
			loading.value = false
		}

		if (loginData) {
			emit('loggedIn', loginData.email, loginData.currentLocale)
		}
	}
</script>

<style scoped>
	.error-message {
		color: red;
		margin-top: 10px;
	}
</style>
