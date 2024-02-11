<template>
    <VDialog v-model="dialog" width="auto" persistent>
        <VCard>
            <VCardTitle class="center">{{ title }}</VCardTitle>
            <VCardText>
                {{ message }}
            </VCardText>
            <VCardActions class="d-flex justify-center">
                <VBtn color="secondary" @click="done">{{ i18n.t('general.ok') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
<script setup lang="ts">
  import { importDefaults } from '../../compositions/Defaults';
    const {i18n} = importDefaults();
    import { useDialogComposition } from '../../compositions/DialogComposition';
    const { dialog, open, close } = useDialogComposition();
    defineProps({
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
    });
    function done() {
        emit('done');
        close();
    }
    const emit = defineEmits(['done']);
    defineExpose({open});
</script>
