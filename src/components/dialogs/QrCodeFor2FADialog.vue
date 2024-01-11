<template>
    <VDialog v-model="dialog" width="auto" persistent>
        <VCard>
            <VCardTitle class="center">{{ $t('authorization.twoFA') }}</VCardTitle>
            <VCardText class="d-flex flex-column align-items-center">
                <span id="qrPrompt">{{ $t('authorization.scan2FAQrCode') }}</span>
                <img :src="qrCodeImageUrl" alt="QR code for 2FA" />
            </VCardText>
            <VCardActions class="d-flex justify-end mr-2 mb-2">
                <VBtn color="success" @click="done">{{ $t('general.done') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    export default defineComponent({
        props: {
            qrCodeImage: {
                type: String,
                required: true,
                default: '',
            },
        },
        data() {
            return {
                dialog: false,
            };
        },
        computed:{
            qrCodeImageUrl(){
                return `data:image/png;base64,${this.qrCodeImage}`
            }
        },
        methods: {
            open(){
                this.dialog = true;
            },
            close(){
                this.dialog = false;
            },
            done(){
                this.dialog = false;
                this.$emit("done");
            }
        },
        emits: ["done"]
    });
</script>
