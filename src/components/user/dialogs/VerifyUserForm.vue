<template>
	<VForm
		ref="form"
		class="d-flex ga-3 flex-column align-items-center"
		@submit.prevent="onConfirm"
	>
		<MyVerifyPasswordInput v-model="password" />
		<MyTwoFactorAuthInput
			ref="twoFactorAuthInput"
			v-model="twoFactorAuthToken"
			v-model:isTwoFactorAuthError="isTwoFactorAuthError"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import { useI18n } from 'vue-i18n'
	import MyTwoFactorAuthInput from '@/components/user/MyTwoFactorAuthInput.vue'
	import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { API } from '@/_common/axiosConfig.ts'

	const { url = '/user/verify' } = defineProps<{ url?: string }>()

	const dialogApi = useDialogApi<unknown>()
	const { showErrorSnackbar } = useSnackbar()
	const i18n = useI18n()

	const form = ref<InstanceType<typeof VForm>>()
	const twoFactorAuthInput = ref<InstanceType<typeof MyTwoFactorAuthInput>>()
	const password = ref<string | null>(null)
	const twoFactorAuthToken = ref<string | undefined>(undefined)
	const isTwoFactorAuthError = ref(false)

	dialogApi.onConfirm(onConfirm)

	onMounted(async () => {
		await twoFactorAuthInput.value?.triggerVisibilityCheck()
	})

	async function onConfirm() {
		const { valid } = await form.value!.validate()
		if (!valid) return
		dialogApi.setLoading(true)
		try {
			const response = await API.post(url, {
				password: password.value,
				twoFactorAuthToken: twoFactorAuthToken.value,
			})
			dialogApi.close(response.data)
		} catch {
			form.value!.reset()
			showErrorSnackbar(i18n.t('authorization.wrongPassword'), { timeout: 3000 })
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
