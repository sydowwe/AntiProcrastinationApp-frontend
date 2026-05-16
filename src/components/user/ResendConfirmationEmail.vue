<template>
	<div class="text-center">
		<VBtn
			v-if="!confirmationEmailResent"
			color="error"
			@click="resend"
		>
			{{ i18n.t('authorization.resendConfirmationEmail') }}
		</VBtn>
		<div v-if="confirmationEmailResent">{{ i18n.t('authorization.confirmationEmailResent') }}</div>
	</div>
</template>
<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { API } from '@/plugins/axiosConfig.ts'

	const { email } = defineProps<{ email: string }>()

	const i18n = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()

	const confirmationEmailResent = ref(false)

	async function resend() {
		showFullScreenLoading()
		API.post(`/auth/resend-confirmation-email-by-email/${email}`)
			.then(() => {
				confirmationEmailResent.value = true
			})
			.catch(() => {
				showErrorSnackbar(i18n.t('general.error'))
			})
			.finally(() => {
				hideFullScreenLoading()
			})
	}
</script>
