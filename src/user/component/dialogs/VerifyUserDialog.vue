<template>
	<MyDialog
		v-model="dialog"
		:title="title ?? i18n.t('user.identityVerification')"
		:confirmBtnDisabled="loading"
		eager
		@confirmed="validateAndSendForm"
	>
		<VForm
			ref="form"
			class="d-flex ga-3 flex-column align-center"
			@submit.prevent="validateAndSendForm()"
		>
			<slot></slot>
			<MyVerifyPasswordInput v-model="password"></MyVerifyPasswordInput>
			<slot name="center"></slot>
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
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { API } from '@/_common/axiosConfig.ts'

	const {
		title,
		url = '/user/verify',
		useDefaultSubmitFunction = true,
	} = defineProps<{
		title?: string
		url?: string
		useDefaultSubmitFunction?: boolean
	}>()
	const emit = defineEmits<{
		verified: [data: unknown]
		submitted: [password: string | null, twoFactorAuthToken: string | undefined]
	}>()
	const i18n = useI18n()
	const { showErrorSnackbar } = useSnackbar()

	const dialog = ref(false)
	const form = ref<InstanceType<typeof VForm>>()
	const twoFactorAuthInput = ref<InstanceType<typeof MyTwoFactorAuthInput>>()

	const password = ref<string | null>(null)
	const loading = ref(false)

	const twoFactorAuthToken = ref<string | undefined>(undefined)
	const isTwoFactorAuthError = ref(false)

	async function open() {
		if (!(await twoFactorAuthInput.value!.triggerVisibilityCheck())) {
			dialog.value = true
		}
	}

	function close() {
		dialog.value = false
	}

	function closeAndReset() {
		close()
		reset()
	}

	function reset() {
		form.value!.reset()
	}

	async function defaultSubmit() {
		try {
			const response = await API.post(url, {
				password: password.value,
				twoFactorAuthToken: twoFactorAuthToken.value,
			})
			emit('verified', response.data)
			close()
		} catch {
			form.value!.reset()
			showErrorSnackbar(i18n.t('authorization.wrongPassword'), { timeout: 3000 })
		} finally {
			loading.value = false
		}
	}

	async function validateAndSendForm() {
		loading.value = true
		const { valid } = await form.value!.validate()
		if (valid) {
			if (useDefaultSubmitFunction) {
				await defaultSubmit()
			} else {
				emit('submitted', password.value, twoFactorAuthToken.value)
				loading.value = false
			}
		} else {
			loading.value = false
		}
	}

	defineExpose({ open, close, reset, closeAndReset })
</script>
