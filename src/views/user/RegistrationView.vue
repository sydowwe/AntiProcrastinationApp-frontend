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
		<QrCodeFor2FADialog
			v-model="qrCode2FADialog"
			:qrCodeImage="qrCodeImage"
			@done="goToLogin"
		></QrCodeFor2FADialog>
	</VRow>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import QrCodeFor2FADialog from '../../components/user/dialogs/QrCodeFor2FADialog.vue'
	import MyNewPasswordInput from '@/components/user/MyNewPasswordInput.vue'
	import { useUserDetailsValidation } from '@/utils/UserAuthUtils.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import router from '@/plugins/router.ts'
	import { useUserStore } from '@/stores/userStore.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import { useRecaptcha } from '@/composables/UseRecaptchaHandler.ts'
	import { useI18n } from 'vue-i18n'
	import { handleHttpCodes } from '@/composables/general/ErrorHandlingFunctions.ts'
	import { VForm } from 'vuetify/components'
	import { RegistrationRequest } from '@/dtos/request/user/RegistrationRequest.ts'
	import { AvailableLocales } from '@/dtos/enum/AvailableLocales.ts'

	const i18n = useI18n()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
	const { showErrorSnackbar } = useSnackbar()
	const userStore = useUserStore()
	const { emailRules } = useUserDetailsValidation()

	async function goToLogin() {
		await router.push({ name: 'login' })
	}

	const form = ref<InstanceType<typeof VForm>>()
	const registrationRequest = ref(new RegistrationRequest())

	const termsAndConditions = ref(false)
	const termsAndConditionsRules = [(v: boolean) => v || i18n.t('authorization.termsAndConditionsRequired')]

	const qrCode2FADialog = ref(false)
	const qrCodeImage = ref('')

	const { executeRecaptcha } = useRecaptcha()

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
								qrCodeImage.value = response.data.qrCode
								qrCode2FADialog.value = true
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
