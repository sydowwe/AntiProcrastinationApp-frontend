<template>
<VTextField
	:label="label ?? $t('authorization.password')"
	v-model="password"
	:rules="rules"
	:type="showPassword ? 'text' : 'password'"
	:append-inner-icon="showPassword ? 'eye-slash' : 'eye'"
	@click:append-inner="showPassword = !showPassword"
	:autofocus="autofocus"
	:autocomplete="isNew ? 'new-password' : 'current-password'"
></VTextField>
</template>
<script setup lang="ts">
import {ref} from 'vue';
const password = defineModel<string | null>({required: true});
defineProps({
	isNew: {
		type: Boolean, default: false
	},
	rules: {
		type: Array,
		required: true
	},
	label: {
		type: String,
		default: null
	},
	autofocus: {
		type: Boolean,
		default: false
	}
})
const showPassword = ref(false);
const error = ref(false);
</script>