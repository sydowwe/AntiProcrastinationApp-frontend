<template>
<GoogleLogin :callback="callback">
	<VBtn
		width="100%"
		color="primary"
		:disabled="loading"
	>
		{{ $t('authorization.continueWithGoogle') }}
		<VIcon class="ml-1">
		</VIcon>
	</VBtn>
</GoogleLogin>
<div v-if="error" class="error-message">Error logging in. Please try again.</div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {GoogleSignInRequest} from '@/dtos/request/GoogleSignInRequest.ts';
import {type CallbackTypes, GoogleLogin} from "vue3-google-login";
import {API} from '@/plugins/axiosConfig.ts';
import {useRecaptcha} from '@/composables/UseRecaptchaHandler.ts';

const {executeRecaptcha} = useRecaptcha();

const props = defineProps({
	isStayLoggedIn: {
		required: true,
		type: Boolean,
	},
});

const emit = defineEmits(["logged-in"]);

const googleSignInRequest = ref(new GoogleSignInRequest());
const loading = ref(false);
const error = ref(false);

const callback: CallbackTypes.CodeResponseCallback = async (response) => {
	console.log("Authorisation code", response.code);

	loading.value = true;
	error.value = false;

	try {
		const recaptchaToken = await executeRecaptcha('google_sign_in');

		if (recaptchaToken) {
			googleSignInRequest.value.stayLoggedIn = props.isStayLoggedIn;
			googleSignInRequest.value.recaptchaToken = recaptchaToken;
			googleSignInRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			googleSignInRequest.value.code = response.code;

			const apiResponse = await API.post('/user/google-sign-in', googleSignInRequest.value);
			emit('logged-in', apiResponse.data.email, apiResponse.data.currentLocale);
		}
	} catch (err) {
		console.log(err);
		error.value = true;
	} finally {
		loading.value = false;
	}
};


const handleOnError = (errorEntity: any) => {
	console.log("Error: ", errorResponse);
	error.value = true;
	loading.value = false;
};

</script>

<style scoped>
iframe {
	width: 224px !important;
	height: 40px !important;
	margin: 0 !important;
}

.haAclf {
	padding: 0 !important;
}

.error-message {
	color: red;
	margin-top: 10px;
}
</style>