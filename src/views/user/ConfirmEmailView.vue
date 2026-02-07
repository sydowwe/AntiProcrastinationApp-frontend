<template>
<div class="mx-auto my-auto text-center">
	<div v-if="emailConfirmed" class="text-center d-flex flex-column">
		<div class="mb-3 text-success">{{ i18n.t('authorization.emailConfirmed') }}</div>
		<VBtn color="main" @click="router.push('/login')">{{ i18n.t('authorization.goToLogin') }}</VBtn>
	</div>
	<div v-if="emailConfirmationError" class="text-center">
		<!--			<span>{{ i18n.t('') }}</span>-->
		<VBtn color="error" @click="resendConfirmationEmail">{{ i18n.t('authorization.resendConfirmationEmail') }}</VBtn>
	</div>
	<div v-if="confirmationEmailResent">{{ i18n.t('authorization.confirmationEmailResent') }}</div>
</div>
</template>
<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {onMounted, ref} from "vue";
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useLoading} from '@/composables/general/LoadingComposable.ts';
import router from '@/plugins/router.ts';
import {API} from '@/plugins/axiosConfig.ts';

const i18n = useI18n();
const {showErrorSnackbar} = useSnackbar()
const {showFullScreenLoading} = useLoading()

let emailConfirmed = ref(false);
let emailConfirmationError = ref(false);
let confirmationEmailResent = ref(false);
onMounted(() => {
	showFullScreenLoading();
	emailConfirmed.value = false;
	emailConfirmationError.value = false;
	API.post('/auth' + router.currentRoute.value.fullPath)
		.then(() => {
			emailConfirmed.value = true;
		})
		.catch((error) => {
			showErrorSnackbar(i18n.t('authorization.errorConfirmingEmail'));
			emailConfirmationError.value = true;
			console.log(error);
		});
})
const resendConfirmationEmail = () => {
	showFullScreenLoading();
	emailConfirmed.value = false;
	emailConfirmationError.value = false;
	API.post(`/auth/resend-confirmation-email/${router.currentRoute.value.query['userId']}`)
		.then(() => {
			confirmationEmailResent.value = true;
		})
		.catch((error) => {
			showErrorSnackbar('Error');
			emailConfirmationError.value = true;
			console.log(error);
		});
}
</script>