<template>
<VDialog v-model="dialog" persistent eager>
	<VRow justify="center">
		<VCol cols="12" sm="10" md="8" lg="4">
			<VCard class="pa-1">
				<VCardTitle class="center">{{ i18n.t('user.passwordChange') }}</VCardTitle>
				<VCardText class="py-1">
					<VForm ref="form" @submit.prevent="submit" class="d-flex ga-3 flex-column align-items-center">
						<MyVerifyPasswordInput v-model="password"></MyVerifyPasswordInput>
						<MyNewPasswordInput v-model="newPassword"></MyNewPasswordInput>
						<MyTwoFactorAuthInput ref="twoFactorAuthInput" v-model="twoFactorAuthToken" :isTwoFactorAuthError="isTwoFactorAuthError"></MyTwoFactorAuthInput>
					</VForm>
				</VCardText>
				<VCardActions class="d-flex justify-center mr-2 mb-2">
					<VBtn color="error" @click="close">{{ i18n.t('general.cancel') }}</VBtn>
					<VBtn color="success" @click="submit">{{ i18n.t('general.save') }}</VBtn>
				</VCardActions>
			</VCard>
		</VCol>
	</VRow>
</VDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {MyTwoFactorAuthInputType, VuetifyFormType} from '@/classes/types/RefTypeInterfaces';
import {useDialogComposition} from '@/compositions/DialogComposition';
import {useI18n} from 'vue-i18n';
import {importDefaults} from '@/compositions/Defaults';
import MyTwoFactorAuthInput from '@/components/MyTwoFactorAuthInput.vue';
import MyVerifyPasswordInput from '@/components/MyVerifyPasswordInput.vue';
import MyNewPasswordInput from '@/components/MyNewPasswordInput.vue';

const {showSuccessSnackbar} = importDefaults();


const {dialog} = useDialogComposition();
const form = ref<VuetifyFormType>({});
const i18n = useI18n();

const password = ref<string | null>(null);

const newPassword = ref<string | null>(null);

const twoFactorAuthToken = ref<string | null>(null);
const isTwoFactorAuthError = ref(false);
const twoFactorAuthInput = ref<MyTwoFactorAuthInputType>({} as MyTwoFactorAuthInputType);

async function open() {
	if(!(await twoFactorAuthInput.value.triggerVisibilityCheck())){
		dialog.value = true;
	}
}
function close() {
	dialog.value = false;
	form.value.reset();
}

async function submit() {
	const {valid} = await form.value.validate();
	if (valid) {
		axios
			.post('/user/change-password', {
				currentPassword: password.value,
				newPassword: newPassword.value,
				twoFactorAuthToken: twoFactorAuthToken.value
			})
			.then((response) => {
				showSuccessSnackbar(i18n.t('user.passwordChangedSuccessfully'));
				close();
			})
			.catch((error) => {
				console.log(error);
				form.value.reset();
			});
	}
}

defineExpose({open});
</script>
