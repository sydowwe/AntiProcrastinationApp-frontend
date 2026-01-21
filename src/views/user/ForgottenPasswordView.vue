<template>
<VRow justify="center" align="center" class="h-100">
	<VCol cols="11" sm="7" md="5" lg="4">
		<h2>{{ i18n.t('authorization.forgotPassword') }}</h2>
		<h4 class="mb-3">{{ i18n.t('authorization.enterEmailToResetPassword') }}</h4>
		<VForm @submit.prevent="resetPassword" ref="form" class="text-center">
			<VTextField class="mb-3 text-start" :label="i18n.t('authorization.email')" v-model="email" :rules="emailRules"></VTextField>
			<VBtn type="submit" color="primary">{{ i18n.t('authorization.resetPassword') }}</VBtn>
		</VForm>
	</VCol>
</VRow>
<MyDialog :title="i18n.t('authorization.passwordResetEmailSent')" :model-value="dialog" :text="i18n.t('authorization.passwordResetEmailSentInstructions')"
          :has-close-btn="false" :has-confirm-btn="false"></MyDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {useUserDetailsValidation} from '@/composables/UserAutorizationComposition';
import {useI18n} from 'vue-i18n';
import {VForm} from 'vuetify/components';
import MyDialog from "@/components/dialogs/MyDialog.vue";
import {useLoading} from '@/composables/general/LoadingComposable.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {API} from '@/plugins/axiosConfig.ts';

const {emailRules} = useUserDetailsValidation();
const {showFullScreenLoading, hideFullScreenLoading} = useLoading()
const {showErrorSnackbar} = useSnackbar();
const i18n = useI18n();
const form = ref<InstanceType<typeof VForm>>();
const email = ref('');
const dialog = ref(false);

async function resetPassword() {
	const {valid} = await form.value!.validate();
	if (valid) {
		showFullScreenLoading();
		API
			.post('/user/forgotten-password', {email: email.value})
			.then(() => {
				dialog.value = true;
			})
			.catch((error) => {
				if (error.response.status === 404) {
					showErrorSnackbar('Email not found');
				} else {
					console.log('Error', error.message);
				}
			})
			.finally(() => {
				hideFullScreenLoading();
			});
	}
}
</script>