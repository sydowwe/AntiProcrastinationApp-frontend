<template>
<VDialog v-model="dialog" max-width="600">
	<VCard>
		<VCardTitle class="headline">{{ title }}</VCardTitle>
		<VCardText>
			<slot></slot>
		</VCardText>
		<VCardActions class="justify-center">
			<VBtn variant="elevated" color="red" @click="close()">{{ i18n.t('general.cancel') }}</VBtn>
			<VBtn variant="elevated" color="green" @click="confirmed()">{{ confirmBtnLabel }}</VBtn>
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
	title: String,
	confirmBtnLabel: {
		type: String,
		requrired: true,
	},
});

function confirmed() {
	emit('confirmed');
	close();
}

const emit = defineEmits(['confirmed']);
defineExpose({open});
</script>
