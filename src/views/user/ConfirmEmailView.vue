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
import {importDefaults} from "@/compositions/general/Defaults";
import {onMounted, ref} from "vue";

const i18n = useI18n();
const {router, userStore, showFullScreenLoading, showErrorSnackbar} = importDefaults();

let emailConfirmed = ref(false);
let emailConfirmationError = ref(false);
let confirmationEmailResent = ref(false);
onMounted(() => {
	showFullScreenLoading();
	emailConfirmed.value = false;
	emailConfirmationError.value = false;
	axios
		.get('/user' + router.currentRoute.value.fullPath)
		.then(() => {
			emailConfirmed.value = true;
		})
		.catch((error) => {
			showErrorSnackbar(i18n.t('authorization.errorConfirmingEmail'));
			emailConfirmationError.value = true;
			console.log(error);
		});
})
const resendConfirmationEmail = ()=>{
	showFullScreenLoading();
	emailConfirmed.value = false;
	emailConfirmationError.value = false;
	axios
		.get(`/user/resend-confirmation-email?userId=${router.currentRoute.value.query['userId']}`)
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