<template>
    <VDialog v-model="dialog" max-width="600">
        <VCard>
            <VCardTitle class="headline">{{ i18n.t('planner.task') }}</VCardTitle>
            <VCardText>
                <VSelect :items="intervals" item-value="id" item-title="label"></VSelect>
                <VTextField v-model="task"></VTextField>
                <VColorPicker v-model="color" hide-inputs></VColorPicker>
            </VCardText>
            <VCardActions class="justify-center">
                <VBtn variant="elevated" color="red" @click="close">{{ i18n.t('general.cancel') }}</VBtn>
                <VBtn variant="elevated" color="green" @click="save">{{ i18n.t('general.save') }}</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { importDefaults } from '../../compositions/Defaults';
    const { i18n } = importDefaults();
    import { useDialogComposition } from '../../compositions/DialogComposition';
import { IdLabelOption } from '../../classes/IdLabelOption';
    const { dialog, open, close } = useDialogComposition();

    const props = defineProps<{
        intervals: IdLabelOption[];
    }>();

    const task = ref('');
    const color = ref(null);

    function save() {
        emit('saved', task, color);
        close();
    }
    const emit = defineEmits(['saved']);
    defineExpose({ open });
</script>
