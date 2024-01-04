<template>
    <VDialog v-model="dialog" width="auto" persistent>
        <VCard>
            <VCardTitle class="center">{{ title }}</VCardTitle>
            <VCardText>                
                    {{ message }}
            </VCardText>
            <VCardActions class="d-flex justify-center">
                <VBtn color="secondary" @click="dialog = false">{{ $t('general.ok') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
<script lang="ts">
    import { defineComponent } from 'vue';
    export default defineComponent({
        props: {
            title: {
                type: String,
                required: true,
                default: 'Error',
            },
            message: {
                type: String,
                required: true,
                default: null,
            },
        },
        data() {
            return {
                dialog: false,             
            };
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
