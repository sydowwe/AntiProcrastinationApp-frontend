<template>
	<MyDialog
		v-model="dialog"
		:title="title ?? i18n.t('user.identityVerification')"
		eager
		@closed="close"
		@confirmed="validateAndSendForm"
	>
		<VForm
			ref="form"
			class="d-flex ga-3 flex-column align-items-center"
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
	import MyTwoFactorAuthInput from '@/components/user/MyTwoFactorAuthInput.vue'
	import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { API } from '@/plugins/axiosConfig.ts'

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
		API.post(url, {
			password: password.value,
			twoFactorAuthToken: twoFactorAuthToken.value,
		})
			.then(response => {
				emit('verified', response.data)
				close()
			})
			.catch(() => {
				form.value!.reset()
				showErrorSnackbar(i18n.t('authorization.wrongPassword'), { timeout: 3000 })
			})
	}

	async function validateAndSendForm() {
		loading.value = true
		const { valid } = await form.value!.validate()
		if (valid) {
			if (useDefaultSubmitFunction) {
				await defaultSubmit()
			} else {
				emit('submitted', password.value, twoFactorAuthToken.value)
			}
		} else {
			loading.value = false
		}
	}

	defineExpose({ open, close, reset, closeAndReset })
</script>
