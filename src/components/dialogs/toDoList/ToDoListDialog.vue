<template>
   <v-dialog v-model="dialog" max-width="600">
        <v-card class="px-6 py-4 text-center">
            <v-card-title class="pa-0">{{ isEdit ? $t('general.edit') : $t('general.add') + ' to to-do list' }}</v-card-title>
            <v-card-text class="px-0">
                <VTextField :label="$t('general.name')" v-model="toDoListItem.name"></VTextField>
                <VTextField :label="$t('general.text')" v-model="toDoListItem.text"></VTextField>
                <VSelect :label="$t('toDoList.urgency')" v-model="toDoListItem.urgencyId" :clearable="false" hide-details item-title="text" item-value="id" :items="urgencyOptions"></VSelect>
            </v-card-text>
            <v-card-actions class="justify-end px-0">
                <v-btn color="red" @click="close">{{ $t('general.cancel') }}</v-btn>
                <v-btn color="green" @click="save">{{ isEdit ? $t('general.edit') : $t('general.add') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { UrgencyEntity } from '../../../classes/UrgencyEntity';
    import { ToDoListItemRequest, ToDoListItemEntity } from '../../../classes/ToDoListItem';

    const toDoListItem = ref(new ToDoListItemRequest());
    const dialog = ref(false);
    const isEdit = ref(false);
    const idToEdit = ref(null as number | null);
    const urgencyOptions = ref([] as UrgencyEntity[]);
    
    watch(dialog, (newValue, oldValue) => {
        if (!newValue) {
            toDoListItem.value = new ToDoListItemRequest();
            setDefaultUrgency();
        }
    });
    const emit = defineEmits(['edit', 'add']);
    getUrgencyOptions();
    function save() {
        if (isEdit.value) {
            emit('edit', idToEdit.value, toDoListItem.value);
        } else {
            emit('add', toDoListItem.value);
        }
        dialog.value = false;
    }

    function setDefaultUrgency() {
        toDoListItem.value.urgencyId = urgencyOptions.value.find((item) => item.priority === 1)?.id ?? null;
    }
    function getUrgencyOptions() {
        window.axios
            .post(`/urgency/get-all`)
            .then((response) => {
                urgencyOptions.value = UrgencyEntity.listFromObjects(response.data);
                setDefaultUrgency();
            })
            .catch((error) => {});
    }

    const close = () => {
        dialog.value = false;
    };
    const openCreate = () => {
        isEdit.value = false;
        console.log(isEdit.value);
        
        dialog.value = true;
    };
    const openEdit = (entityToEdit: ToDoListItemEntity) => {
        isEdit.value = true;
        idToEdit.value = entityToEdit.id;
        toDoListItem.value = ToDoListItemRequest.fromEntity(entityToEdit);
        dialog.value = true;
    };
   
    defineExpose({
        openCreate,
        openEdit,
        close,
    });
</script>
