<template>
	<MyPasswordInput
		v-model="newPassword"
		:label="isNew ? i18n.t('user.newPassword') : i18n.t('user.password')"
		:rules="newPasswordRules"
		:isNew
		class="mb-2"
	></MyPasswordInput>
	<MyPasswordInput
		v-model="newPasswordConfirm"
		:label="isNew ? i18n.t('user.confirmNewPassword') : i18n.t('user.confirmPassword')"
		:rules="confirmNewPasswordRules"
		:isNew
	></MyPasswordInput>
</template>
<script setup lang="ts">
	import MyPasswordInput from '@/core/user/component/MyPasswordInput.vue'
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'

	const { isNew } = defineProps<{
		isNew: boolean
	}>()

	const newPassword = defineModel<string | null>({ required: true })

	const i18n = useI18n()
	const { passwordRequiredRule, passwordLengthRule, newPasswordStrengthRule } = useGeneralRules()

	const newPasswordConfirm = ref<string | null>(null)

	const newPasswordRules = [passwordRequiredRule, passwordLengthRule, newPasswordStrengthRule]
	const confirmNewPasswordRules = [
		...newPasswordRules,
		(v: string) => doPasswordsMatch(v) || i18n.t('user.passwordsDontMatch'),
	]

	function doPasswordsMatch(value: string) {
		return value === newPassword.value
	}
</script>
