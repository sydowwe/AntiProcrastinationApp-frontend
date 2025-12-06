<template>
<div class="flex-grow-1">
	<VRow justify="center" class="mt-16">
		<VCol cols="12" sm="10" md="8" lg="6">
			<h2 class="text-center mb-5">{{ i18n.t('authorization.login') }}</h2>
			<VForm ref="form" @submit.prevent="validateAndSendForm()" validateOn="submit"
			       class="d-flex flex-column">
				<VTextField class="mb-3" :label="i18n.t('authorization.email')" v-model="loginRequest.email"
				            :rules="emailRules"
				            :autofocus="!isRedirectedFromRegistration"></VTextField>
				<MyVerifyPasswordInput
					v-model="loginRequest.password"
					:autofocus="isRedirectedFromRegistration"
				></MyVerifyPasswordInput>
				<VRow justify="center">
					<VCol cols="12" sm="6" class="pb-0 pb-sm-3">
						<VCheckbox :label="i18n.t('authorization.stayLoggedIn')" v-model="loginRequest.stayLoggedIn"
						           hide-details></VCheckbox>
					</VCol>
					<VCol cols="12" sm="6" class="d-flex align-center justify-start justify-sm-end pt-2 pt-sm-3">
						<RouterLink class="mx-3" to="/forgotten-password">{{
								i18n.t('authorization.forgotPassword')
							}}
						</RouterLink>
					</VCol>
					<VCol cols="10" sm="8" md="6" lg="6">
						<VBtn type="submit" width="100%" color="successDark">{{ i18n.t('authorization.logIn') }}</VBtn>
						<div class="mt-3 mb-2 text-center">
							{{ i18n.t('authorization.dontHaveAccountYet') }}
							<RouterLink to="/registration">{{ i18n.t('authorization.register') }}</RouterLink>
						</div>
					</VCol>
				</VRow>
				<div class="d-flex flex-column align-center">
					<div class="dividerTextCenter mb-4" style="width: 66%">
						<span class="text-center font-weight-medium mx-3">{{ i18n.t('general.or') }}</span>
					</div>
					<GoogleSignIn :is-stay-logged-in="loginRequest.stayLoggedIn" @loggedIn="handleGoogleLogin"></GoogleSignIn>
				</div>
			</VForm>
		</VCol>
	</VRow>
	<LoginVerifyQrCode v-model="twoFactorAuthDialog" :email="loginRequest.email"
	                   :stayLoggedIn="loginRequest.stayLoggedIn"></LoginVerifyQrCode>
</div>
</template>
<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import GoogleSignIn from '@/components/user/GoogleSignIn.vue';
import LoginVerifyQrCode from '../../components/user/LoginVerifyQrCode.vue';
import {useUserDetailsValidation} from '@/composables/UserAutorizationComposition';
import {useI18n} from 'vue-i18n';
import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useUserStore} from '@/stores/userStore.ts';
import {useLoading} from '@/composables/general/LoadingComposable.ts';
import router from '@/plugins/router.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {useRecaptcha} from '@/composables/UseRecaptchaHandler.ts';
import type {VuetifyFormType} from '@/types/RefTypeInterfaces.ts';
import {PasswordSignInRequest} from '@/dtos/request/PasswordSignInRequest.ts';

const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar();
const {showFullScreenLoading, hideFullScreenLoading, axiosSuccessLoadingHide} = useLoading();
const userStore = useUserStore();
const {emailRules} = useUserDetailsValidation();
const {executeRecaptcha} = useRecaptcha();

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const loginRequest = ref(new PasswordSignInRequest());

const twoFactorAuthDialog = ref(false);

onMounted(async () => {
	loginRequest.value.email = userStore.userName;
});

const isRedirectedFromRegistration = computed(() => !!userStore.userName);

async function validateAndSendForm() {
	const {valid} = await form.value.validate();
	console.log(valid)
	if (valid) {
		showFullScreenLoading();
		loginRequest.value.recaptchaToken = await executeRecaptcha('login');
		loginRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		axiosSuccessLoadingHide.value = false;
		API.post('/user/login', JSON.stringify(loginRequest.value))
			.then((response) => {
				if (response.data) {
					// i18n.locale.value = response.data.currentLocale.toUpperCase();
					if (response.data.requiresTwoFactor === true) {
						twoFactorAuthDialog.value = true;
					} else {
						userStore.login(response.data.email);
						router.push('/');
					}
				} else {
					showErrorSnackbar('No user!!!');
					console.error('No user!!!');
				}
			})
			.catch((error) => {
					if (error.response.status === 401) {
						let tooManyAttemptsErrorMessage = error.response.data.errors.generalErrors.find((e: string) => e.includes('Too many failed login attempts'))
						if (tooManyAttemptsErrorMessage) {
							showErrorSnackbar(tooManyAttemptsErrorMessage)
						} else if (error.response.data.errors.generalErrors.includes('Invalid email or password')) {
							showErrorSnackbar(i18n.t('authorization.wrongEmailOrPassword'));
						}
					}
					if (error.response.status === 403) {
						if (error.response.data.errors.generalErrors.includes('User locked out for')) {
							showErrorSnackbar(error.response.data.errors.generalErrors[0]);
						} else if (error.response.data.errors.generalErrors.includes('Email not confirmed')) {
							showErrorSnackbar(i18n.t('authorization.emailConfirmationNeeded'));
						}
					}
				}
			).finally(() => {
			hideFullScreenLoading();
		})
	}
}

function handleGoogleLogin(email: string, currentLocale: string) {
	i18n.locale.value = currentLocale.toUpperCase();
	userStore.login(email);
	router.push('/');
}
</script>