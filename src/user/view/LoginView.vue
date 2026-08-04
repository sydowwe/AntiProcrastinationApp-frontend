<template>
	<div class="login-page w-100 d-flex align-center justify-center">
		<VCard
			class="login-card pa-6 pa-sm-8"
			color="surface"
			elevation="6"
			rounded="lg"
			maxWidth="460"
			width="100%"
		>
			<div class="text-center mb-6">
				<h2 class="text-h4 font-weight-bold mb-1">{{ i18n.t('authorization.login') }}</h2>
				<p class="text-textMuted text-body-2 mb-0">
					{{ i18n.t('general.please') }} {{ i18n.t('authorization.logIn').toLowerCase() }}
				</p>
			</div>
			<VForm
				ref="form"
				@submit.prevent="validateAndSendForm()"
				validateOn="submit"
				class="d-flex flex-column ga-1"
			>
				<VTextField
					v-model="loginRequest.email"
					:label="i18n.t('authorization.email')"
					:rules="[emailRule, requiredRule]"
					:autofocus="!isRedirectedFromRegistration"
					prependInnerIcon="envelope"
				></VTextField>
				<MyVerifyPasswordInput
					v-model="loginRequest.password"
					:autofocus="isRedirectedFromRegistration"
				></MyVerifyPasswordInput>

				<div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
					<VCheckbox
						v-model="loginRequest.stayLoggedIn"
						:label="i18n.t('authorization.stayLoggedIn')"
						hideDetails
						density="compact"
					></VCheckbox>
					<RouterLink
						to="/forgotten-password"
						class="text-primaryOutline text-body-2 text-decoration-none"
					>
						{{ i18n.t('authorization.forgotPassword') }}
					</RouterLink>
				</div>

				<VBtn
					class="mb-4"
					type="submit"
					color="primary"
					size="large"
					block
					appendIcon="arrow-right-to-bracket"
				>
					{{ i18n.t('authorization.logIn') }}
				</VBtn>

				<VBtn
					v-if="showResendConfirmation"
					class="mb-4"
					color="secondaryOutline"
					variant="outlined"
					size="large"
					block
					:loading="resendLoading"
					appendIcon="envelope"
					@click="resendConfirmation()"
				>
					{{ i18n.t('authorization.resendConfirmationEmail') }}
				</VBtn>

				<div class="divider-with-text mb-4">
					<span class="text-textMuted text-body-2 mx-3">{{ i18n.t('general.or') }}</span>
				</div>

				<MicrosoftLogin
					width="100%"
					@loggedIn="handleMicrosoftLogin"
				></MicrosoftLogin>
			</VForm>
		</VCard>
		<LoginVerifyQrCode
			v-model="twoFactorAuthDialog"
			:email="loginRequest.email ?? ''"
			:stayLoggedIn="loginRequest.stayLoggedIn"
		></LoginVerifyQrCode>
	</div>
</template>
<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { PasswordSignInRequest } from '@/core/user/dto/request/PasswordSignInRequest.ts'
	import LoginVerifyQrCode from '../component/LoginVerifyQrCode.vue'
	import { useI18n } from 'vue-i18n'
	import MyVerifyPasswordInput from '@/core/user/component/MyVerifyPasswordInput.vue'
	import MicrosoftLogin from '@/core/user/component/MicrosoftLogin.vue'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import router from '@/router.ts'
	import { useRoute } from 'vue-router'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useRecaptcha } from '@/_common/composable/UseRecaptchaHandler.ts'
	import type { VForm } from 'vuetify/components'
	import { API } from '@/_common/axiosConfig.ts'
	import { useAuthStore } from '@/core/user/store/authStore.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useErrorHandling } from '@/_common/composable/general/ErrorHandlingFunctions.ts'
	import { resendConfirmationEmail } from '@/core/user/api/UserApi.ts'

	const i18n = useI18n()
	const route = useRoute()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { handleHttpCodes } = useErrorHandling()
	const { showFullScreenLoading, hideFullScreenLoading, axiosSuccessLoadingHide } = useLoading()
	const authStore = useAuthStore()
	const { requiredRule, emailRule } = useGeneralRules()
	const { executeRecaptcha } = useRecaptcha()

	const form = ref<InstanceType<typeof VForm>>()
	const loginRequest = ref(new PasswordSignInRequest())

	const twoFactorAuthDialog = ref(false)
	const showResendConfirmation = ref(false)
	const resendLoading = ref(false)

	onMounted(async () => {
		loginRequest.value.email = authStore.emailFromRegistration
		showResendConfirmation.value = isRedirectedFromRegistration.value
	})

	const isRedirectedFromRegistration = computed(() => !!authStore.emailFromRegistration)

	async function validateAndSendForm() {
		const { valid } = await form.value!.validate()
		if (valid) {
			showFullScreenLoading()
			loginRequest.value.recaptchaToken = await executeRecaptcha('login')
			loginRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
			axiosSuccessLoadingHide.value = false
			try {
				const response = await API.post('/auth/login', loginRequest.value)
				if (response.data) {
					if (response.data.requiresTwoFactor === true) {
						twoFactorAuthDialog.value = true
					} else {
						await authStore.authenticated()
						await router.push((route.query.redirect as string) ?? '/')
					}
				} else {
					showErrorSnackbar(i18n.t('authorization.loginError'))
				}
			} catch (error: any) {
				const status = error.response?.status
				const generalErrors: string[] = error.response?.data?.errors?.generalErrors ?? []
				if (status === 401) {
					const tooManyAttemptsErrorMessage = generalErrors.find((e: string) =>
						e.includes('Too many failed login attempts'),
					)
					if (tooManyAttemptsErrorMessage) {
						showErrorSnackbar(tooManyAttemptsErrorMessage)
					} else if (generalErrors.includes('Invalid email or password')) {
						showErrorSnackbar(i18n.t('authorization.wrongEmailOrPassword'))
					} else {
						handleHttpCodes(status)
					}
				} else if (status === 403) {
					if (generalErrors.includes('User locked out for')) {
						showErrorSnackbar(generalErrors[0])
					} else if (generalErrors.includes('Email not confirmed')) {
						showErrorSnackbar(i18n.t('authorization.emailConfirmationNeeded'))
						showResendConfirmation.value = true
					} else {
						handleHttpCodes(status)
					}
				} else if (status !== undefined) {
					handleHttpCodes(status)
				} else {
					showErrorSnackbar(i18n.t('httpErrors.unknown'))
				}
			} finally {
				hideFullScreenLoading()
			}
		}
	}

	async function resendConfirmation() {
		resendLoading.value = true
		try {
			await resendConfirmationEmail(loginRequest.value.email ?? '')
			showResendConfirmation.value = false
			showSuccessSnackbar(i18n.t('authorization.resendConfirmationEmail'))
		} catch (error: any) {
			handleHttpCodes(error.response?.status)
		} finally {
			resendLoading.value = false
		}
	}

	async function handleMicrosoftLogin(code: string) {
		showFullScreenLoading()
		axiosSuccessLoadingHide.value = false
		try {
			const response = await API.post('auth/microsoft-sign-in', {
				code,
				isStayLoggedIn: loginRequest.value.stayLoggedIn,
			})
			if (response.data) {
				await authStore.authenticated()
				await router.push((route.query.redirect as string) ?? '/')
			} else {
				showErrorSnackbar(i18n.t('authorization.loginError'))
			}
		} catch (error: any) {
			const status = error.response?.status
			if (status !== undefined) {
				handleHttpCodes(status)
			} else {
				showErrorSnackbar(i18n.t('httpErrors.unknown'))
			}
		} finally {
			hideFullScreenLoading()
		}
	}
</script>

<style scoped>
	.login-page {
		background:
			radial-gradient(circle at 15% 20%, rgba(var(--v-theme-primary), 0.08), transparent 45%),
			radial-gradient(circle at 85% 80%, rgba(var(--v-theme-secondary), 0.08), transparent 45%);
	}

	.login-card {
		border: 1px solid rgba(var(--v-border-color), 0.18);
		backdrop-filter: blur(4px);
	}

	.divider-with-text {
		display: flex;
		align-items: center;
		text-align: center;
	}

	.divider-with-text::before,
	.divider-with-text::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid rgba(var(--v-border-color), 0.25);
	}
</style>
