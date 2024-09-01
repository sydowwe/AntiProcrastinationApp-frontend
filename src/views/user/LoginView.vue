<template>
<VRow justify="center" class="mt-16">
	<VCol cols="12" sm="10" md="8" lg="6">
		<h2 class="text-center mb-5">{{ i18n.t('authorization.login') }}</h2>
		<VForm ref="form" @submit.prevent="validateAndSendForm()" validateOn="submit" class="d-flex flex-column">
			<VTextField class="mb-3" :label="i18n.t('authorization.email')" v-model="loginRequest.email" :rules="emailRules"
			            :autofocus="!isRedirectedFromRegistration"></VTextField>
			<VTextField
				:label="i18n.t('authorization.password')"
				v-model="loginRequest.password"
				:rules="passwordRulesLog"
				:type="showPassword ? 'text' : 'password'"
				:append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
				@click:append-inner="showPassword = !showPassword"
				:autofocus="isRedirectedFromRegistration"
			></VTextField>
			<VRow justify="center">
				<VCol cols="12" sm="6" class="pb-0 pb-sm-3">
					<VCheckbox :label="i18n.t('authorization.stayLoggedIn')" v-model="loginRequest.stayLoggedIn"
					           hide-details></VCheckbox>
				</VCol>
				<VCol cols="12" sm="6" class="d-flex align-center justify-start justify-sm-end pt-2 pt-sm-3">
					<RouterLink class="mx-3" to="/forgotten-password">{{ i18n.t('authorization.forgotPassword') }}</RouterLink>
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
	<VDialog v-model="dialog" width="small" persistent>
		<VCard>
			<VCardTitle>{{ dialogTitle }}</VCardTitle>
			<VCardText>
				<LoginVerifyQrCode :email="loginRequest.email" ref="verifyQrCode"></LoginVerifyQrCode>
			</VCardText>
			<VCardActions class="d-flex justify-end mr-2 mb-2">
				<VBtn color="error" @click="dialog = false">{{ i18n.t('general.close') }}</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</VRow>
</template>
<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {VuetifyFormType, SubmittableType} from '@/classes/types/RefTypeInterfaces';
import {AvailableLocales, LoginRequest} from '@/classes/User';
import GoogleSignIn from '../../components/GoogleSignIn.vue';
import LoginVerifyQrCode from '../../components/LoginVerifyQrCode.vue';
import {importDefaults} from '@/compositions/Defaults';
import {useUserDetailsValidation} from '@/compositions/UserAutorizationComposition';
import {useI18n} from 'vue-i18n';
import {useChallengeV3} from 'vue-recaptcha'
import {useLoadingStore} from '@/stores/globalFeedbackStores';

const i18n = useI18n();
const {router,userStore,showErrorSnackbar} = importDefaults();
const {emailRules, passwordRulesLog} = useUserDetailsValidation();


const form = ref<VuetifyFormType>({} as VuetifyFormType);
const verifyQrCode = ref<SubmittableType>({} as SubmittableType);
const loginRequest = ref(new LoginRequest());

const showPassword = ref(false);
const dialogTitle = ref('');
const dialog = ref(false);

onMounted(() => {
	loginRequest.value.email = userStore.getEmail;
});
const isRedirectedFromRegistration = computed(() => !!userStore.getEmail);

const {execute} = useChallengeV3('login');

async function validateAndSendForm() {
	const {valid} = await form.value.validate();
	if (valid) {
		const recaptchaToken = await execute();
		if (recaptchaToken != null && recaptchaToken != '') {
			loginRequest.value.recaptchaToken = recaptchaToken;
			loginRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			loginRequest.value.currentLocale = AvailableLocales[i18n.locale.value.toUpperCase() as keyof typeof AvailableLocales];
			useLoadingStore().axiosSuccessLoadingHide = false;
			axios
				.post('/user/login', JSON.stringify(loginRequest.value))
				.then((response) => {
					if (response.data) {
						console.log(response);
						userStore.authenticated(loginRequest.value.email);
						i18n.locale.value = response.data.currentLocale.toUpperCase();
						if (response.data.requiresTwoFactor === true) {
							dialogTitle.value = 'authorization.twoFA';
							dialog.value = true;
						}
						router.push('/');
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
				});
		}
	}
}
</script>