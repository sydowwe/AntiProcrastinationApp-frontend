<template>
	<VOtpInput
		v-if="isTwoFactorAuthRequired"
		v-model="token"
		:label="$t('authorization.code')"
		hideDetails
		autofocus
		focused
		:error="isTwoFactorAuthError"
		@input="isTwoFactorAuthError = false"
	></VOtpInput>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { API } from '@/plugins/axiosConfig.ts'

	const isTwoFactorAuthError = defineModel<boolean>('isTwoFactorAuthError', { required: true })
	const token = defineModel<string | undefined>({ required: true })
	const isTwoFactorAuthRequired = ref(false)

	async function triggerVisibilityCheck() {
		return await API.get('/user/2fa/status', {})
			.then(response => {
				let isError = false
				if (response.data === true) {
					isTwoFactorAuthRequired.value = true
				} else if (response.data === false) {
					isTwoFactorAuthRequired.value = false
					token.value = undefined
				} else {
					console.error(response.data)
					isError = true
				}
				return isError
			})
			.catch(error => {
				console.error(error)
				return true
			})
	}

	defineExpose({ triggerVisibilityCheck })
</script>
