<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card>
            <v-card-title class="headline">{{ title }}</v-card-title>
            <v-card-text>
                <slot></slot>
            </v-card-text>
            <v-card-actions class="justify-center">
                <VBtn variant="elevated" color="red" @click="close()">{{ i18n.t('general.cancel') }}</VBtn>
                <VBtn variant="elevated" color="green" @click="confirmed()">{{ confirmBtnLabel }}</VBtn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
  import { importDefaults } from '../../compositions/Defaults';
    const {i18n} = importDefaults();
    import { useDialogComposition } from '../../compositions/DialogComposition';
    const { dialog, open, close } = useDialogComposition();
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
