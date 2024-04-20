<template>
<VRow justify="center" class="mt-16">
	<VCol cols="12" sm="10" md="8" lg="6">
		<h2 class="text-center mb-5">{{ $t('authorization.registration') }}</h2>
		<VForm ref="form" @submit.prevent="validateAndSendForm" class="d-flex flex-column">
			<VTextField class="mb-3" :label="i18n.t('authorization.name')" v-model="formData.name" :rules="nameRules"
			            autofocus></VTextField>
			<VTextField class="mb-3" :label="i18n.t('authorization.surname')" v-model="formData.surname"
			            :rules="surnameRules"></VTextField>
			<VTextField class="mb-3" :label="i18n.t('authorization.email')" v-model="formData.email" :rules="emailRules"></VTextField>
			<VTextField
				:label="i18n.t('authorization.password')"
				v-model="formData.password"
				:rules="passwordRulesReg"
				:type="showPassword ? 'text' : 'password'"
				:append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
				@click:append-inner="showPassword = !showPassword"
			></VTextField>
			<VCheckbox :label="i18n.t('authorization.use2FASetup')" v-model="formData.use2FA" hide-details></VCheckbox>
			<VCheckbox class="mb-3" v-model="termsAndConditions" :rules="termsAndConditionsRules">
				<template v-slot:label>
					{{ i18n.t('general.iAgreeTo') }}&nbsp;
					<RouterLink to="/terms-and-conditions">
						{{ i18n.t('authorization.termsAndConditions') }}
					</RouterLink>
				</template>
			</VCheckbox>
			<div class="d-flex">
				<VueRecaptcha :load-recaptcha-script="true" sitekey="6Lfl3L8pAAAAAM25iDjXyjOOSISv5kqozSWPKwrN"
				              theme="light"></VueRecaptcha>
			</div>
			<VRow justify="center">
				<VCol cols="10" sm="8" md="6" lg="6">
					<VBtn type="submit" width="100%" color="success">{{ i18n.t('authorization.register') }}</VBtn>
				</VCol>
			</VRow>
		</VForm>
	</VCol>
	<QrCodeFor2FADialog ref="qrCode2FADialog" :qrCodeImage="qrCodeImage" @done="goToLogin"></QrCodeFor2FADialog>
	<ErrorDialog ref="errorDialog" :title="errorDialogTitle" :message="errorDialogMessage"></ErrorDialog>
	<LoadingFullscreen :show="loading"></LoadingFullscreen>
</VRow>
</template>

<script setup lang="ts">
import {VuetifyFormType, DialogType} from '@/classes/types/RefTypeInterfaces';
import {ref} from 'vue';
import QrCodeFor2FADialog from '../../components/dialogs/QrCodeFor2FADialog.vue';
import ErrorDialog from '../../components/dialogs/ErrorDialog.vue';
import LoadingFullscreen from '../../components/dialogs/LoadingFullscreen.vue';
import VueRecaptcha from 'vue3-recaptcha2';
import {importDefaults} from '@/compositions/Defaults';
import {useUserDetailsValidation} from '@/compositions/UserAutorizationComposition';

const {i18n, userStore, goToLogin, showErrorSnackbar} = importDefaults();
const {emailRules, nameRules, surnameRules, passwordRulesReg} = useUserDetailsValidation();

const form = ref<VuetifyFormType>({} as VuetifyFormType);
const qrCode2FADialog = ref<DialogType>({} as DialogType);
const errorDialog = ref<DialogType>({} as DialogType);

const formData = ref({
	name: '',
	surname: '',
	email: '',
	password: '',
	use2FA: true,
});
const termsAndConditions = ref(false);
const showPassword = ref(false);
const qrCodeImage = ref('');
const termsAndConditionsRules = [(v: boolean) => v || i18n.t('authorization.termsAndConditionsRequired')];

const loading = ref(false);
const errorDialogTitle = ref('Dialog');
const errorDialogMessage = ref('');

async function validateAndSendForm() {
	const {valid} = await form.value.validate();
	if (valid) {
		axios
			.post('/user/auth/register', formData.value)
			.then((response) => {
				if (response.data?.email) {
					userStore.setEmail(response.data.email);
					if (response.data?.has2FA) {
						if (response.data.qrCode) {
							qrCodeImage.value = response.data.qrCode;
							qrCode2FADialog.value.open();
						} else {
							console.error('No qrCode!!!');
						}
					} else {
						goToLogin();
					}
				} else {
					console.error('No email!!!');
				}
			})
			.catch((error) => {
				console.log(error);
			});
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