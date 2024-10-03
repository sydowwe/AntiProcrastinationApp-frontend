<template>
<MyDialog v-model="dialog" :title="i18n.t('authorization.twoFA')" @confirmed="done"
          :confirmBtnLabel="i18n.t('general.done')" :hasCloseBtn="false">
	<div class="d-flex flex-column align-items-center">
		<span id="qrPrompt">{{ i18n.t('authorization.scan2FAQrCode') }}</span>
		<img :src="qrCodeImageUrl" alt="QR code for 2FA"/>
	</div>
</MyDialog>
</template>
<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';

const i18n = useI18n();
import MyDialog from '@/components/dialogs/MyDialog.vue';

const dialog = defineModel<boolean>({required: true})

const props = defineProps({
	qrCodeImage: {
		type: String,
		required: true,
		default: '',
	},
});
const qrCodeImageUrl = computed(() => `data:image/png;base64,${props.qrCodeImage}`);

function done() {
	emit('done');
	dialog.value = false;
}

const emit = defineEmits(['done']);
</script>
