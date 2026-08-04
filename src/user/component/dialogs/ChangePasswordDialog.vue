<template>
	<MyDialog
		v-model="dialog"
		:title="i18n.t('user.passwordChange')"
		eager
		@closed="form?.reset"
		@confirmed="submit"
	>
		<VForm
			ref="form"
			class="pt-3 pb-2 d-flex ga-3 flex-column align-center"
			@submit.prevent="submit"
		>
			<h5 class="text-red">{{ i18n.t('user.signOutWarning', { subject: i18n.t('user.passwordChange') }) }}</h5>
			<MyVerifyPasswordInput v-model="password"></MyVerifyPasswordInput>
			<MyNewPasswordInput v-model="newPassword"></MyNewPasswordInput>
			<MyTwoFactorAuthInput
				ref="twoFactorAuthInput"
				v-model="twoFactorAuthToken"
				v-model:isTwoFactorAuthError="isTwoFactorAuthError"
			></MyTwoFactorAuthInput>
		</VForm>
	</MyDialog>
</template>
<script setup lang="ts">
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import { useI18n } from 'vue-i18n'

	import MyTwoFactorAuthInput from '@/core/user/component/MyTwoFactorAuthInput.vue'
	import MyVerifyPasswordInput from '@/core/user/component/MyVerifyPasswordInput.vue'
	import MyNewPasswordInput from '@/core/user/component/MyNewPasswordInput.vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { API } from '@/_common/axiosConfig.ts'

	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const form = ref<InstanceType<typeof VForm>>()
	const i18n = useI18n()

	const dialog = ref(false)

	const password = ref<string | null>(null)

	const newPassword = ref<string | null>(null)

	const twoFactorAuthToken = ref<string | undefined>(undefined)
	const isTwoFactorAuthError = ref(false)
	const twoFactorAuthInput = ref<InstanceType<typeof MyTwoFactorAuthInput>>()

	function close() {
		dialog.value = false
	}

	async function open() {
		if (!(await twoFactorAuthInput.value!.triggerVisibilityCheck())) {
			dialog.value = true
		}
	}

	async function submit() {
		const { valid } = await form.value!.validate()
		if (valid) {
			try {
				await API.post('/user/change-password', {
					currentPassword: password.value,
					newPassword: newPassword.value,
					twoFactorAuthToken: twoFactorAuthToken.value,
				})
				showSuccessSnackbar(i18n.t('user.passwordChangedSuccessfully'))
				close()
			} catch {
				showErrorSnackbar(i18n.t('authorization.wrongPassword'))
				form.value!.reset()
			}
		}
	}

	defineExpose({ open })
</script>
