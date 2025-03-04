<template>
<VRow justify="center" no>
	<VCol cols="10" sm="8" md="6" lg="6">
		<VBtn
			width="100%"
			color="primary"
			:disabled="loading && !isReady"
			@click="login"
		>
			{{ $t('authorization.continueWithGoogle') }}
			<VIcon class="ml-1">
				<FontAwesomeIcon icon="fa-brands fa-google"/>
			</VIcon>
		</VBtn>
		<div v-if="error" class="error-message">Error logging in. Please try again.</div>
	</VCol>
</VRow>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useChallengeV3} from 'vue-recaptcha';
import {GoogleSignInRequest} from '@/classes/User';
import {
	useCodeClient,
	type ImplicitFlowSuccessResponse,
	type ImplicitFlowErrorResponse,
} from "vue3-google-signin";

const props = defineProps({
	isStayLoggedIn: {
		required: true,
		type: Boolean,
	},
});
const {execute} = useChallengeV3('google_sign_in');
const googleSignInRequest = ref(new GoogleSignInRequest());
const loading = ref(false);
const error = ref(false);

const handleOnSuccess = async (response: ImplicitFlowSuccessResponse) => {
	loading.value = true;
	error.value = false;
	const recaptchaToken = await execute();
	if (recaptchaToken) {
		googleSignInRequest.value.stayLoggedIn = props.isStayLoggedIn;
		googleSignInRequest.value.recaptchaToken = recaptchaToken;
		googleSignInRequest.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		googleSignInRequest.value.code = response.code;
		axios
			.post('/user/google-sign-in', googleSignInRequest.value)
			.then((response) => {
				emit('logged-in', response.data.email, response.data.currentLocale);
			})
			.catch((err) => {
				console.log(err);
				error.value = true;
			})
			.finally(() => {
				loading.value = false;
			});
	}
};

const handleOnError = (errorResponse: ImplicitFlowErrorResponse) => {
	console.log("Error: ", errorResponse);
};

const { isReady, login } = useCodeClient({
	onSuccess: handleOnSuccess,
	onError: handleOnError,
	scope: "email openid",
	redirect_uri: "https://localhost:3000"
	// other options
});

const emit = defineEmits(["logged-in"]);
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