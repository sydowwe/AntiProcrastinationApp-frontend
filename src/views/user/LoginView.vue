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
							<VBtn type="submit" width="100%" color="success">{{ i18n.t('authorization.logIn') }}</VBtn>
							<div class="mt-3 mb-2 text-center">
								{{ i18n.t('authorization.dontHaveAccountYet') }}
								<RouterLink to="/registration">{{ i18n.t('authorization.register') }}</RouterLink>
							</div>
						</VCol>
					</VRow>
					<div class="dividerTextCenter mb-4">
						<span class="text-center font-weight-medium mx-3">{{ i18n.t('general.or') }}</span>
					</div>
					<GoogleSignIn></GoogleSignIn>
				</VForm>
			</VCol>
		</VRow>
		<LoginVerifyQrCode v-model="twoFactorAuthDialog" :email="loginRequest.email"
						   :stayLoggedIn="loginRequest.stayLoggedIn"></LoginVerifyQrCode>
	</div>
</template>
<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {VuetifyFormType} from '@/classes/types/RefTypeInterfaces';
import {AvailableLocales, LoginRequest} from '@/classes/User';
import GoogleSignIn from '../../components/GoogleSignIn.vue';
import LoginVerifyQrCode from '../../components/user/LoginVerifyQrCode.vue';
import {importDefaults} from '@/compositions/Defaults';
import {useUserDetailsValidation} from '@/compositions/UserAutorizationComposition';
import {useI18n} from 'vue-i18n';
import {useChallengeV3} from 'vue-recaptcha'
import {useLoadingStore} from '@/stores/globalFeedbackStores';
import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue';

const i18n = useI18n();
const {router, userStore, showErrorSnackbar} = importDefaults();
const {emailRules} = useUserDetailsValidation();

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const loginRequest = ref(new LoginRequest());

const twoFactorAuthDialog = ref(false);

onMounted(() => {
	loginRequest.value.email = userStore.getEmail;
});
const isRedirectedFromRegistration = computed(() => !!userStore.getEmail);

const {execute} = useChallengeV3('login');
const loadingStore = useLoadingStore();

async function validateAndSendForm() {
	const {valid} = await form.value.validate();
	if (valid) {
		loadingStore.showFullScreenLoading();
		const recaptchaToken = await execute();
		if (recaptchaToken != null && recaptchaToken != '') {
			loginRequest.value.recaptchaToken = recaptchaToken;
			loginRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			loginRequest.value.currentLocale = AvailableLocales[i18n.locale.value.toUpperCase() as keyof typeof AvailableLocales];
			loadingStore.axiosSuccessLoadingHide = false;
			axios
				.post('/user/login', JSON.stringify(loginRequest.value))
				.then((response) => {
					if (response.data) {
						i18n.locale.value = response.data.currentLocale.toUpperCase();
						if (response.data.requiresTwoFactor === true) {
							twoFactorAuthDialog.value = true;
						} else {
							userStore.authenticated(response.data.email);
							router.push('/');
						}
					} else {
						showErrorSnackbar('No user!!!');
						console.error('No user!!!');
					}
				})
				.catch((error) => {
					console.log(error);
					if (error.response.status === 403 || error.response.status === 401) {
						showErrorSnackbar(i18n.t('authorization.wrongEmailOrPassword'));
					}
					if (error.response.status === 412) {
						showErrorSnackbar(i18n.t('authorization.emailConfirmationNeeded', {email: error.response.data.split(`'`)[1]}));
					}
					if (error.response.status === 404) {
						showErrorSnackbar(i18n.t('authorization.userDoesntExist', {email: error.response.data.split(`'`)[1]}));
					}
				});
		}
	}
}
</script>