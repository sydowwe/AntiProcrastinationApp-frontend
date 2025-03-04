<template>
<VOtpInput
	v-if="isTwoFactorAuthRequired"
	:label="$t('authorization.code')"
	v-model="token"
	hide-details
	autofocus
	focused
	:error="isTwoFactorAuthError"
	@input="isTwoFactorAuthError = false"
></VOtpInput>
</template>

<script setup lang="ts">
import {ref} from 'vue';

const token = defineModel<string | null>({required: true});
defineProps({
	isTwoFactorAuthError: {
		type: Boolean,
		required: true
	}
})

const isTwoFactorAuthRequired = ref(false);

async function triggerVisibilityCheck() {
	return await  axios
		.post('/user/get-2fa-status', {})
		.then((response) => {
			let isError = false;
			if (response.data === true) {
				isTwoFactorAuthRequired.value = true;
			} else if (response.data === false) {
				isTwoFactorAuthRequired.value = false;
				token.value = null;
			} else {
				console.error(error);
				isError = true;
			}
			return isError;
		})
		.catch((error) => {
			console.error(error);
			return true;
		});
}
defineExpose({ triggerVisibilityCheck });
</script>