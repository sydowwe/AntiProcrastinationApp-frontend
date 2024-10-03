<template>
<MyDialog :title="i18n.t('authorization.twoFA')" v-model="dialog" :hasConfirmBtn="false">
	<div>
		<VOtpInput @finish="submit" :label="$t('authorization.code')" v-model="token" hide-details autofocus focused :error="error"
		           :loading="loading" @input="error = false"></VOtpInput>
		<h5 class="text-center">{{ $t('authorization.code2FA') }}</h5>
	</div>
</MyDialog>
</template>
<script setup lang="ts">
import {ref} from 'vue';
import {importDefaults} from '@/compositions/Defaults';
import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';

const {router, userStore} = importDefaults();
const i18n = useI18n();

const props = defineProps({
	stayLoggedIn: {
		type: Boolean,
		required: true,
	},
});
const dialog = defineModel<boolean>({required: true})

const token = ref('');
const loading = ref(false);
const error = ref(false);

function submit() {
	loading.value = true;
	axios
		.post('/user/login-2fa', {
			stayLoggedIn: props.stayLoggedIn,
			token: token.value,
		})
		.then((response) => {
			userStore.authenticated(response.data.email);
			router.push('/');
		})
		.catch((_error) => {
			console.log(_error);
			error.value = true;
			code.value = '';
		});
}
</script>