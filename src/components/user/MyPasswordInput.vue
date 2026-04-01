<template>
	<VTextField
		v-model="password"
		:label="label ?? $t('authorization.password')"
		:rules="rules"
		:type="showPassword ? 'text' : 'password'"
		:appendInnerIcon="showPassword ? 'eye-slash' : 'eye'"
		:autofocus="autofocus"
		:autocomplete="isNew ? 'new-password' : 'current-password'"
		@click:appendInner="showPassword = !showPassword"
	></VTextField>
</template>
<script setup lang="ts">
	import { ref } from 'vue'

	const { isNew = false, rules, label = null, autofocus = false } = defineProps<{
		isNew?: boolean
		rules: unknown[]
		label?: string | null
		autofocus?: boolean
	}>()
	const password = defineModel<string | null>({ required: true })
	const showPassword = ref(false)
</script>
