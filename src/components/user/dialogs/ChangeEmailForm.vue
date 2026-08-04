<template>
	<VForm
		ref="form"
		class="d-flex ga-3 flex-column align-items-center"
		@submit.prevent="onConfirm"
	>
		<h5 class="text-red">{{ $t('user.signOutWarning', { subject: $t('user.emailChange') }) }}</h5>
		<VTextField
			v-model="newEmail"
			:label="$t('authorization.email')"
			:rules="newEmailRules"
			validateOn="submit"
		/>
		<MyVerifyPasswordInput v-model="password" />
		<MyTwoFactorAuthInput
			ref="twoFactorAuthInput"
			v-model="twoFactorAuthToken"
			v-model:isTwoFactorAuthError="isTwoFactorAuthError"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import { useI18n } from 'vue-i18n'
	import MyTwoFactorAuthInput from '@/components/user/MyTwoFactorAuthInput.vue'
	import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useUserDetailsValidation } from '@/utils/UserAuthUtils.ts'
	import { API } from '@/plugins/axiosConfig.ts'

	const { currentEmail } = defineProps<{ currentEmail: string }>()

	const dialogApi = useDialogApi<boolean>()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const i18n = useI18n()
	const { emailRules } = useUserDetailsValidation()

	const form = ref<InstanceType<typeof VForm>>()
	const twoFactorAuthInput = ref<InstanceType<typeof MyTwoFactorAuthInput>>()
	const newEmail = ref('')
	const password = ref<string | null>(null)
	const twoFactorAuthToken = ref<string | undefined>(undefined)
	const isTwoFactorAuthError = ref(false)

	const newEmailRules = computed(() => [
		(v: string) => v !== currentEmail || i18n.t('user.emailCantBeSame'),
		...emailRules,
	])

	dialogApi.onConfirm(onConfirm)

	onMounted(async () => {
		await twoFactorAuthInput.value?.triggerVisibilityCheck()
	})

	async function onConfirm() {
		const { valid } = await form.value!.validate()
		if (!valid) return
		dialogApi.setLoading(true)
		try {
			await API.patch('/user/change-email', {
				newEmail: newEmail.value,
				password: password.value,
				twoFactorAuthToken: twoFactorAuthToken.value,
			})
			showSuccessSnackbar(i18n.t('user.emailChangedSuccessfully'))
			dialogApi.close(true)
		} catch {
			form.value!.reset()
			showErrorSnackbar(i18n.t('authorization.wrongPassword'), { timeout: 3000 })
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
