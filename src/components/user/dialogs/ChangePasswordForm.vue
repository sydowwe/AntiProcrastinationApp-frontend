<template>
	<VForm
		ref="form"
		class="pt-3 pb-2 d-flex ga-3 flex-column align-items-center"
		@submit.prevent="onConfirm"
	>
		<h5 class="text-red">{{ $t('user.signOutWarning', { subject: $t('user.passwordChange') }) }}</h5>
		<MyVerifyPasswordInput v-model="password" />
		<MyNewPasswordInput
			v-model="newPassword"
			isNew
		/>
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
	import MyNewPasswordInput from '@/components/user/MyNewPasswordInput.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { API } from '@/_common/axiosConfig.ts'

	const dialogApi = useDialogApi<boolean>()
	const { showSuccessSnackbar } = useSnackbar()
	const i18n = useI18n()

	const form = ref<InstanceType<typeof VForm>>()
	const twoFactorAuthInput = ref<InstanceType<typeof MyTwoFactorAuthInput>>()
	const password = ref<string | null>(null)
	const newPassword = ref<string | null>(null)
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
			await API.post('/user/change-password', {
				currentPassword: password.value,
				newPassword: newPassword.value,
				twoFactorAuthToken: twoFactorAuthToken.value,
			})
			showSuccessSnackbar(i18n.t('user.passwordChangedSuccessfully'))
			dialogApi.close(true)
		} catch {
			form.value!.reset()
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
