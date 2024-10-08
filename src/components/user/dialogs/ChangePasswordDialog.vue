<template>
<MyDialog v-model="dialog" :title="i18n.t('user.passwordChange')" @closed="form.reset" @confirmed="submit" :eager="true">
	<VForm ref="form" @submit.prevent="submit" class="pt-3 pb-2 d-flex ga-3 flex-column align-items-center">
		<h5 class="text-red">{{i18n.t('user.signOutWarning',{subject: i18n.t('user.passwordChange')})}}</h5>
		<MyVerifyPasswordInput v-model="password"></MyVerifyPasswordInput>
		<MyNewPasswordInput v-model="newPassword"></MyNewPasswordInput>
		<MyTwoFactorAuthInput ref="twoFactorAuthInput" v-model="twoFactorAuthToken" :isTwoFactorAuthError="isTwoFactorAuthError"></MyTwoFactorAuthInput>
	</VForm>
</MyDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {MyTwoFactorAuthInputType, VuetifyFormType} from '@/classes/types/RefTypeInterfaces';
import {useI18n} from 'vue-i18n';
import {importDefaults} from '@/compositions/Defaults';
import MyTwoFactorAuthInput from '@/components/user/MyTwoFactorAuthInput.vue';
import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue';
import MyNewPasswordInput from '@/components/user/MyNewPasswordInput.vue';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const {showSuccessSnackbar} = importDefaults();
const form = ref<VuetifyFormType>({});
const i18n = useI18n();

const dialog = ref(false);

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
