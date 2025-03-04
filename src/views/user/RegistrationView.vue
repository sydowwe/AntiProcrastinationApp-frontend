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
	<QrCodeFor2FADialog ref="qrCode2FADialog" :qrCodeImage="qrCodeImage" @done="goToLogin"></QrCodeFor2FADialog>
	<ErrorDialog ref="errorDialog" :title="errorDialogTitle" :message="errorDialogMessage"></ErrorDialog>
</VRow>
</template>

<script setup lang="ts">
import {VuetifyFormType, DialogType} from '@/classes/types/RefTypeInterfaces';
import {ref} from 'vue';
import QrCodeFor2FADialog from '../../components/user/dialogs/QrCodeFor2FADialog.vue';
import ErrorDialog from '../../components/dialogs/general/ErrorDialog.vue';
import MyNewPasswordInput from '@/components/user/MyNewPasswordInput.vue';
import {importDefaults} from '@/compositions/general/Defaults';
import {useUserDetailsValidation} from '@/compositions/UserAutorizationComposition';

import {useI18n} from 'vue-i18n';

const i18n = useI18n();
const {userStore, goToLogin, showErrorSnackbar, showFullScreenLoading, hideFullScreenLoading} = importDefaults();
const {emailRules} = useUserDetailsValidation();

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const qrCode2FADialog = ref<DialogType>({} as DialogType);
const errorDialog = ref<DialogType>({} as DialogType);

const registrationRequest = ref(new RegistrationRequest());
const termsAndConditions = ref(false);
const qrCodeImage = ref('');
const termsAndConditionsRules = [(v: boolean) => v || i18n.t('authorization.termsAndConditionsRequired')];

const errorDialogTitle = ref('Dialog');
const errorDialogMessage = ref('');

import {useChallengeV3} from 'vue-recaptcha'
import {AvailableLocales, RegistrationRequest} from '@/classes/User';

const {execute} = useChallengeV3('register');


async function validateAndSendForm() {
	const recaptchaToken = await execute();
	const {valid} = await form.value.validate();
	if (valid) {
		showFullScreenLoading();
		if (recaptchaToken != null && recaptchaToken != '') {
			registrationRequest.value.recaptchaToken = recaptchaToken;
			registrationRequest.value.currentLocale = AvailableLocales[i18n.locale.value.toUpperCase() as keyof typeof AvailableLocales];
			registrationRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			console.log(registrationRequest.value);
			axios
				.post('/user/register', registrationRequest.value)
				.then((response) => {
					hideFullScreenLoading();
					console.log(response);
					userStore.setEmail(registrationRequest.value.email);
					if (response.data?.twoFactorEnabled) {
						if (response.data.qrCode) {
							if (response.data.recoveryCodes) {
								qrCodeImage.value = response.data.qrCode;
								qrCode2FADialog.value.open();
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