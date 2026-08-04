<template>
	<VerifyUserDialog
		ref="verifyDialog"
		:title="i18n.t('user.emailChange')"
		:useDefaultSubmitFunction="false"
		@submitted="onSubmit"
	>
		<h5 class="text-red">{{ i18n.t('user.signOutWarning', { subject: i18n.t('user.emailChange') }) }}</h5>
		<VTextField
			v-model="newEmail"
			class="mb-0"
			:label="i18n.t('authorization.email')"
			:rules="newEmailRules"
			validateOn="submit"
		></VTextField>
	</VerifyUserDialog>
</template>
<script setup lang="ts">
	import VerifyUserDialog from '@/core/user/component/dialogs/VerifyUserDialog.vue'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { API } from '@/_common/axiosConfig.ts'

	const { email } = defineProps<{
		email: string
	}>()
	const emit = defineEmits<{
		changed: []
	}>()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const i18n = useI18n()
	const { emailRule } = useGeneralRules()

	const newEmailRules = [(v: string) => v !== email || i18n.t('user.emailCantBeSame'), emailRule]
	const verifyDialog = ref<InstanceType<typeof VerifyUserDialog>>()

	const newEmail = ref<string>('')

	watch(
		() => email,
		newValue => {
			newEmail.value = newValue
		},
	)

	async function onSubmit(password: string | null, twoFactorAuthToken: string | undefined) {
		try {
			await API.post('/user/change-email', {
				newEmail: newEmail.value,
				password: password,
				twoFactorAuthToken: twoFactorAuthToken,
			})
			verifyDialog.value?.closeAndReset()
			emit('changed')
			showSuccessSnackbar(i18n.t('user.emailChangedSuccessfully'))
		} catch {
			verifyDialog.value?.reset()
			showErrorSnackbar(i18n.t('authorization.wrongPassword'), { timeout: 3000 })
		}
	}

	function open() {
		verifyDialog.value?.open()
	}

	defineExpose({ open })
</script>
