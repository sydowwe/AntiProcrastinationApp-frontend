<template>
<VRow justify="center" class="mt-16">
	<VCol cols="12" sm="10" md="8" lg="6">
		<h2 class="text-center mb-5">{{ $t('authorization.registration') }}</h2>
		<VForm ref="form" @submit.prevent="validateAndSendForm" class="d-flex flex-column">
			<VTextField class="mb-3" :label="i18n.t('authorization.email')" v-model="registrationRequest.email"
			            :rules="emailRules"></VTextField>
			<MyNewPasswordInput v-model="registrationRequest.password"></MyNewPasswordInput>
			<VCheckbox :label="i18n.t('authorization.use2FASetup')" v-model="registrationRequest.twoFactorEnabled"
			           hide-details></VCheckbox>
			<VCheckbox class="mb-3" v-model="termsAndConditions" :rules="termsAndConditionsRules">
				<template v-slot:label>
					{{ i18n.t('general.iAgreeTo') }}&nbsp;
					<RouterLink to="/terms-and-conditions">
						{{ i18n.t('authorization.termsAndConditions') }}
					</RouterLink>
				</template>
			</VCheckbox>
			<VRow justify="center">
				<VCol cols="10" sm="8" md="6" lg="6">
					<VBtn type="submit" width="100%" color="success">{{ i18n.t('authorization.register') }}</VBtn>
				</VCol>
			</VRow>
		</VForm>
	</VCol>
	<QrCodeFor2FADialog v-model="qrCode2FADialog" :qrCodeImage="qrCodeImage" @done="goToLogin"></QrCodeFor2FADialog>
</VRow>
</template>

<script setup lang="ts">
import type {VuetifyFormType, DialogType} from '@/classes/types/RefTypeInterfaces';
import {ref} from 'vue';
import QrCodeFor2FADialog from '../../components/user/dialogs/QrCodeFor2FADialog.vue';
import MyNewPasswordInput from '@/components/user/MyNewPasswordInput.vue';
import {useUserDetailsValidation} from '@/composables/UserAutorizationComposition';

import {useI18n} from 'vue-i18n';

const i18n = useI18n();
const {showFullScreenLoading, hideFullScreenLoading} = useLoading();
const {showErrorSnackbar} = useSnackbar();
const userStore = useUserStore();
const {emailRules} = useUserDetailsValidation();

async function goToLogin() {
	await router.push({ name: 'login' });
}

const form = ref<VuetifyFormType>({} as VuetifyFormType);

const registrationRequest = ref(new RegistrationRequest());
const termsAndConditions = ref(false);
const termsAndConditionsRules = [(v: boolean) => v || i18n.t('authorization.termsAndConditionsRequired')];

const qrCode2FADialog = ref(false);
const qrCodeImage = ref('');

import {AvailableLocales, RegistrationRequest} from '@/classes/User';
import {useLoading} from '@/composables/general/LoadingComposable.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import router from '@/plugins/router.ts';
import {useUserStore} from '@/stores/userStore.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {useRecaptcha} from '@/composables/UseRecaptchaHandler.ts';

const {executeRecaptcha} = useRecaptcha();

async function validateAndSendForm() {
	const recaptchaToken = await executeRecaptcha('register');
	const {valid} = await form.value.validate();
	if (valid) {
		showFullScreenLoading();
		if (recaptchaToken != null && recaptchaToken != '') {
			registrationRequest.value.recaptchaToken = recaptchaToken;
			registrationRequest.value.currentLocale = AvailableLocales[i18n.locale.value.toUpperCase() as keyof typeof AvailableLocales];
			registrationRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			console.log(registrationRequest.value);
			API.post('/user/register', registrationRequest.value)
				.then((response) => {
					hideFullScreenLoading();
					console.log(response);
					userStore.userName = registrationRequest.value.email;
					if (response.data?.twoFactorEnabled) {
						if (response.data.qrCode) {
							if (response.data.recoveryCodes) {
								qrCodeImage.value = response.data.qrCode;
								qrCode2FADialog.value = true;
							} else {
								console.error('No recoveryCodes!!!');
							}
						} else {
							console.error('No QrCode!!!');
						}
					} else {
						goToLogin();
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
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