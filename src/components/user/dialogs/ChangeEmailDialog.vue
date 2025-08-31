<template>
<VerifyUserDialog ref="verifyDialog" @submitted="onSubmit" :title="i18n.t('user.emailChange')" :useDefaultSubmitFunction="false">
	<h5 class="text-red">{{i18n.t('user.signOutWarning',{subject: i18n.t('user.emailChange')})}}</h5>
	<VTextField class="mb-0" :label="i18n.t('authorization.email')" v-model="email" :rules="newEmailRules" validate-on="submit"></VTextField>
</VerifyUserDialog>
</template>
<script setup lang="ts">
import VerifyUserDialog from '@/components/user/dialogs/VerifyUserDialog.vue';
import {useUserDetailsValidation} from '@/composables/UserAutorizationComposition';
import {ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {FormDialogType} from '@/classes/types/RefTypeInterfaces';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();
const i18n = useI18n();
const {emailRules} = useUserDetailsValidation();

const newEmailRules = [(v:string) => v !== props.email || i18n.t('user.emailCantBeSame') ,...emailRules];
const props = defineProps({
	email: {
		type: String,
		required: true,
	}
})
const verifyDialog = ref<FormDialogType>({} as FormDialogType)

const email = ref<string>('');

watch(()=> props.email, (newValue) => {
	email.value = newValue;
})

function onSubmit(password: string, twoFactorAuthToken: string) {
	API.post('/user/change-email', {
		newEmail: email.value,
		password: password,
		twoFactorAuthToken: twoFactorAuthToken
	})
		.then((response) => {
			console.log(response)
			verifyDialog.value.closeAndReset();
			emit('changed');
			showSuccessSnackbar(i18n.t('user.emailChangedSuccessfully'));
		})
		.catch((error) => {
			console.log(error);
			verifyDialog.value.reset();
			showErrorSnackbar(i18n.t('authorization.wrongPassword'), {timeout: 3000})
		})
}

function open(){
	verifyDialog.value.open()
}
const emit = defineEmits(['changed']);
defineExpose({open});
</script>