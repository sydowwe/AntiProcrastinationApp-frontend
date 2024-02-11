<template>
    <VDialog v-model="dialog" width="auto" persistent>
        <VCard>
            <VCardTitle class="center">{{ i18n.t('authorization.twoFA') }}</VCardTitle>
            <VCardText class="d-flex flex-column align-items-center">
                <span id="qrPrompt">{{ i18n.t('authorization.scan2FAQrCode') }}</span>
                <img :src="qrCodeImageUrl" alt="QR code for 2FA" />
            </VCardText>
            <VCardActions class="d-flex justify-end mr-2 mb-2">
                <VBtn color="success" @click="done">{{ i18n.t('general.done') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
<script setup lang="ts">
    import { computed } from 'vue';
    import { importDefaults } from '../../compositions/Defaults';
    const {i18n} = importDefaults();
    import { useDialogComposition } from '../../compositions/DialogComposition';
    const { dialog, open, close } = useDialogComposition();
    const props = defineProps({
        qrCodeImage: {
            type: String,
            required: true,
            default: '',
        },
    });
    const qrCodeImageUrl = computed(() => `data:image/png;base64,${props.qrCodeImage}`);
    function done() {
        close();
        emit('done');
    }
    const emit = defineEmits(['done']);
    defineExpose({open});
</script>
