<template>
<VDialog v-model="dialog" :persistent="persistent">
	<VCard>
		<VCardTitle class="headline">{{ title }}</VCardTitle>
		<VCardText>
			<slot>{{ text }}</slot>
		</VCardText>
		<VCardActions class="d-flex justify-end mr-2 mb-2">
			<VBtn v-if="closable" color="error" @click="close">{{ closeButtonText ?? i18n.t('general.close') }}</VBtn>
			<slot name="secondButton"></slot>
		</VCardActions>
	</VCard>
</VDialog>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';

const i18n = useI18n();
import {useDialogComposition} from '@/compositions/DialogComposition';

const {dialog, open, close} = useDialogComposition();
defineProps({
	title: {
		type: String,
		requrired: true,
	},
	text: String,
	persistent: {
		type: Boolean,
		default: false,
	},
	closable: {
		type: Boolean,
		default: true,
	},
	closeButtonText: {
		type: String,
	},
	confirmBtnLabel: {
		type: String,
		requrired: true,
	},
});
</script>
