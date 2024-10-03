<template>
<MyDialog v-model="dialog" :title="title ?? i18n.t('user.identityVerification')" @closed="close" @confirmed="validateAndSendForm" :eager="true">
	<VForm ref="form" @submit.prevent="validateAndSendForm()" class="d-flex ga-3 flex-column align-items-center">
		<slot></slot>
		<MyVerifyPasswordInput v-model="password"></MyVerifyPasswordInput>
		<slot name="center"></slot>
		<MyTwoFactorAuthInput ref="twoFactorAuthInput" v-model="twoFactorAuthToken"
		                      :isTwoFactorAuthError="isTwoFactorAuthError"></MyTwoFactorAuthInput>
	</VForm>
</MyDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {MyTwoFactorAuthInputType, VuetifyFormType} from '@/classes/types/RefTypeInterfaces';
import {importDefaults} from '@/compositions/Defaults';
import {useI18n} from 'vue-i18n';
import MyTwoFactorAuthInput from '@/components/user/MyTwoFactorAuthInput.vue';
import MyVerifyPasswordInput from '@/components/user/MyVerifyPasswordInput.vue';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const i18n = useI18n();
const {showErrorSnackbar} = importDefaults();

const props = defineProps({
	title: String,
	url: {
		type: String,
		default: '/user/verify',
	},
	useDefaultSubmitFunction: {
		type: Boolean,
		default: true
	}
})
const dialog = ref(false);
const form = ref<VuetifyFormType>({} as VuetifyFormType);

const password = ref<string | null>(null);
const loading = ref(false);

const twoFactorAuthToken = ref<string | null>(null);
const isTwoFactorAuthError = ref(false);
const twoFactorAuthInput = ref<MyTwoFactorAuthInputType>({});

async function open() {
	console.log('aaaa')
	if (!await twoFactorAuthInput.value.triggerVisibilityCheck()) {
		dialog.value = true;
	}
}

function close(){
	dialog.value = false;
}
function closeAndReset(){
	close();
	reset();
}
function reset(){
	form.value.reset();
}

const defaultSubmit = () => axios
	.post(props.url, {
		password: password.value,
		twoFactorAuthToken: twoFactorAuthToken.value
	})
	.then((response) => {
		console.log(response)
		emit('verified', response.data);
		close();
	})
	.catch((error) => {
		console.log(error);
		form.value.reset();
		showErrorSnackbar(i18n.t('authorization.wrongPassword'), {timeout: 3000})
	});

async function validateAndSendForm() {
	loading.value = true;
	const {valid} = await form.value.validate();
	if (valid) {
		if(props.useDefaultSubmitFunction){
			await defaultSubmit();
		}else {
			emit('submitted', password.value,twoFactorAuthToken.value)
		}
	} else {
		loading.value = false;
	}
}

const emit = defineEmits(['verified', 'submitted']);
defineExpose({open, close, reset, closeAndReset });
</script>
