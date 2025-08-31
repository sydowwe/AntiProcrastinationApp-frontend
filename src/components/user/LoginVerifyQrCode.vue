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

import MyDialog from '@/components/dialogs/MyDialog.vue';
import {useI18n} from 'vue-i18n';
import {API} from '@/plugins/axiosConfig.ts';
import router from '@/plugins/router.ts';
import {useUserStore} from '@/stores/userStore.ts';

const i18n = useI18n();
const userStore = useUserStore();

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
	API.post('/user/login-2fa', {
			stayLoggedIn: props.stayLoggedIn,
			token: token.value,
		})
		.then((response) => {
			userStore.login(response.data.userName);
			router.push('/');
		})
		.catch((_error) => {
			console.log(_error);
			error.value = true;
			token.value = '';
		});
}
</script>