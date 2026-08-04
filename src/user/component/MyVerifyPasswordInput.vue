<template>
	<MyPasswordInput
		v-model="password"
		:rules="passwordRulesLog"
		:autofocus="autofocus"
	></MyPasswordInput>
</template>
<script setup lang="ts">
	import MyPasswordInput from '@/core/user/component/MyPasswordInput.vue'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'

	const { autofocus = false } = defineProps<{ autofocus?: boolean }>()

	const password = defineModel<string | null>({ required: true })
	const { passwordRequiredRule, passwordLengthRule } = useGeneralRules()
	const passwordRulesLog = [passwordRequiredRule, passwordLengthRule]
</script>
