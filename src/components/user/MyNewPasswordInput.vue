<template>
<MyPasswordInput
	:label="isNew ? i18n.t('user.newPassword') : i18n.t('user.password')"
	v-model="newPassword"
	:rules="newPasswordRules"
	:isNew
	class="mb-2"
></MyPasswordInput>
<MyPasswordInput
	:label="isNew ? i18n.t('user.confirmNewPassword') : i18n.t('user.confirmPassword')"
	v-model="newPasswordConfirm"
	:rules="confirmNewPasswordRules"
	:isNew
></MyPasswordInput>
</template>
<script setup lang="ts">
import MyPasswordInput from '@/components/user/MyPasswordInput.vue';
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';

const i18n = useI18n();

const {isNew} = defineProps({
	isNew: {
		type: Boolean, default: false
	}
});

const newPassword = defineModel<string | null>({required: true});
const newPasswordConfirm = ref<string | null>(null);

function validatePassword(value: string) {
	const passwordRegex = /^(?=(?:.*[A-Z]){2})(?=(?:.*\d){3})(?=(?:.*[a-z]){2})(?=.*[ -~]).{8,}$/;
	return passwordRegex.test(value);
}

const newPasswordRules = [
	(v: string) => !!v || i18n.t('authorization.passwordRequired'),
	(v: string) => v.length >= 8 || i18n.t('authorization.invalidPasswordLength'),
	(v: string) => validatePassword(v) || i18n.t('authorization.invalidPassword'),
];
const confirmNewPasswordRules = [
	...newPasswordRules,
	(v: string) => doPasswordsMatch(v) || i18n.t('user.passwordsDontMatch'),
];

function doPasswordsMatch(value: string) {
	return value === newPassword.value;
}
</script>
