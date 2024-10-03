<template>
<MyPasswordInput v-model="password" :rules="passwordRulesLog"></MyPasswordInput>
</template>
<script setup lang="ts">
import MyPasswordInput from '@/components/user/MyPasswordInput.vue';
import {useI18n} from 'vue-i18n';
const i18n = useI18n();
const passwordRulesLog = [
	(v: string) => !!v || i18n.t('authorization.passwordRequired'),
	(v: string) => v.length >= 8 || i18n.t('authorization.invalidPasswordLength')
];


const password = defineModel<string | null>({required: true});
defineProps({
	autofocus: {
		type: Boolean,
		default: false
	}
})
</script>