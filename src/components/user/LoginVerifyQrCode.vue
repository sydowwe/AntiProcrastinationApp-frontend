<template>
<MyDialog :title="i18n.t('authorization.twoFA')" v-model="dialog" :hasConfirmBtn="false">
	<div>
		<VOtpInput class="pb-1" ref="otpInput" @finish="submit" :label="$t('authorization.code')" v-model="token" autofocus :error
		           :loading @input="error = false" hide-details></VOtpInput>
		<div v-if="error" class="text-center text-error text-caption mb-2">Nesprávny kód</div>
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
import {VOtpInput} from 'vuetify/components';

const i18n = useI18n();
const userStore = useUserStore();

const props = defineProps({
	stayLoggedIn: {
		type: Boolean,
		required: true,
	},
	email: {
		type: String,
		required: true,
	}
});
const dialog = defineModel<boolean>({required: true})

const otpInput = ref<InstanceType<typeof VOtpInput>>();

const token = ref('');
const loading = ref(false);
const error = ref(false);

function submit() {
	loading.value = true;
	API.post('/auth/login/2fa', {
		stayLoggedIn: props.stayLoggedIn,
		token: token.value,
		email: props.email,
	})
		.then(async (response) => {
			console.log(response);
			userStore.login(props.email);
			await router.push('/');
		})
		.catch((_error) => {
			console.log(_error);
			error.value = true;
			token.value = '';
			otpInput.value?.focus();
		}).finally(() => {
		loading.value = false;
	});
}
</script>