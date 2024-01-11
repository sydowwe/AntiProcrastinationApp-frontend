<template>
    <VDialog v-model="dialog" :persistent="persistent">
        <VCard>
            <VCardTitle class="headline">{{ title }}</VCardTitle>
            <VCardText>
                <slot>{{ text }}</slot>
            </VCardText>
            <VCardActions class="d-flex justify-end mr-2 mb-2">
                <VBtn v-if="closable" color="error" @click="close">{{ closeButtonText ?? $t('general.close') }}</VBtn>
                <slot name="secondButton"></slot>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<script lang="ts">
    export default {
        props: {
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
        },
        data() {
            return {
                dialog: false,
            };
        },
        methods: {
            open() {
                this.dialog = true;
            },
            close() {
                this.dialog = false;
            },
            confirmed() {
                this.$emit('confirmed');
                this.dialog = false;
            },
        },
    };
</script>
