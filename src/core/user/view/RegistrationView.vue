<template>
	<VRow
		justify="center"
		class="mt-16"
	>
		<VCol
			cols="12"
			sm="10"
			md="8"
			lg="6"
		>
			<h2 class="text-center mb-5">{{ $t('authorization.registration') }}</h2>
			<VForm
				ref="form"
				class="d-flex flex-column"
				@submit.prevent="validateAndSendForm"
			>
				<VTextField
					v-model="registrationRequest.email"
					class="mb-3"
					:label="i18n.t('authorization.email')"
					:rules="emailRules"
					autocomplete="new-email"
				></VTextField>
				<MyNewPasswordInput
					v-model="registrationRequest.password"
					isNew
				></MyNewPasswordInput>
				<VCheckbox
					v-model="registrationRequest.twoFactorEnabled"
					:label="i18n.t('authorization.use2FASetup')"
					hideDetails
				></VCheckbox>
				<VCheckbox
					v-model="termsAndConditions"
					class="mb-3"
					:rules="termsAndConditionsRules"
				>
					<template #label>
						{{ i18n.t('general.iAgreeTo') }}&nbsp;
						<RouterLink to="/terms-and-conditions">
							{{ i18n.t('authorization.termsAndConditions') }}
						</RouterLink>
					</template>
				</VCheckbox>
				<VRow justify="center">
					<VCol
						cols="10"
						sm="8"
						md="6"
						lg="6"
					>
						<VBtn
							type="submit"
							width="100%"
							color="successDark"
						>
							{{ i18n.t('authorization.register') }}
						</VBtn>
					</VCol>
				</VRow>
			</VForm>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import QrCodeFor2FABody from '@/core/user/component/dialogs/QrCodeFor2FABody.vue'
	import MyNewPasswordInput from '@/core/user/component/MyNewPasswordInput.vue'
	import { useUserDetailsValidation } from '@/core/user/utils/UserAuthUtils.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'
	import router from '@/plugins/router.ts'
	import { useUserStore } from '@/core/user/store/authStore.ts'
	import { API } from '@/_common/axiosConfig.ts'
	import { useRecaptcha } from '@/_common/composable/UseRecaptchaHandler.ts'
	import { useI18n } from 'vue-i18n'
	import { handleHttpCodes } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { VForm } from 'vuetify/components'
	import { RegistrationRequest } from '@/core/user/dto/request/RegistrationRequest.ts'
	import { AvailableLocales } from '@/_common/dto/enum/AvailableLocales.ts'

	const i18n = useI18n()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
	const { showErrorSnackbar } = useSnackbar()
	const { openDialog } = useDialog()
	const userStore = useUserStore()
	const { emailRules } = useUserDetailsValidation()

	async function goToLogin() {
		await router.push({ name: 'login' })
	}

	const form = ref<InstanceType<typeof VForm>>()
	const registrationRequest = ref(new RegistrationRequest())

	const termsAndConditions = ref(false)
	const termsAndConditionsRules = [(v: boolean) => v || i18n.t('authorization.termsAndConditionsRequired')]

	const { executeRecaptcha } = useRecaptcha()

	async function open2FADialog(qrCodeImage: string) {
		await openDialog({
			component: QrCodeFor2FABody,
			componentProps: { qrCodeImage },
			dialogProps: {
				title: i18n.t('authorization.twoFA'),
				confirmBtnLabel: i18n.t('general.done'),
				hasCloseBtn: false,
			},
		})
		await goToLogin()
	}

	async function validateAndSendForm() {
		const recaptchaToken = await executeRecaptcha('register')
		const { valid } = await form.value!.validate()
		if (valid) {
			showFullScreenLoading()
			if (!recaptchaToken) {
				showErrorSnackbar(i18n.t('authorization.recaptchaFailed'))
				hideFullScreenLoading()
				return
			}
			registrationRequest.value.recaptchaToken = recaptchaToken
			registrationRequest.value.currentLocale =
				AvailableLocales[i18n.locale.value.toUpperCase() as keyof typeof AvailableLocales]
			registrationRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
			API.post('/auth/register', registrationRequest.value)
				.then(response => {
					hideFullScreenLoading()
					userStore.userName = registrationRequest.value.email
					if (response.data?.twoFactorEnabled) {
						if (response.data.qrCode) {
							if (response.data.recoveryCodes) {
								open2FADialog(response.data.qrCode)
							} else {
								showErrorSnackbar(i18n.t('authorization.noRecoveryCodesReceived'))
							}
						} else {
							showErrorSnackbar(i18n.t('authorization.noQrCodeReceived'))
						}
					} else {
						goToLogin()
					}
				})
				.catch(error => {
					hideFullScreenLoading()
					handleHttpCodes(error.response?.status)
				})
		}
	}
</script>
<style>
	.v-checkbox > .v-input__details {
		margin-top: -7px;
		padding-top: 0 !important;
		padding-left: 16px;
	}
</style>
