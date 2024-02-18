<template>
    <VRow justify="center" noGutters>
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <VCard class="mx-auto rounded-lg pa-2 d-flex flex-column px-3 px-md-4 px-lg-6" max-width="600">
                <div class="d-flex flex-column align-center pb-1">
                    <VCardTitle>{{ $t('toDoList.toDoList') }}</VCardTitle>
                </div>
                <div class="d-flex justify-center mb-4">
                    <VBtn width="50%" color="green" @click="toDoListDialog.openCreate">{{ $t('toDoList.add') }}</VBtn>
                </div>
                <ToDoList :kind="ToDoListKind.NORMAL" :items="items" @itemsChanged="itemsChanged" @editItem="toDoListDialog.openEdit"></ToDoList>
            </VCard>
        </VCol>
    </VRow>
    <ToDoListItemDialog ref="toDoListDialog" @add="add" @edit="edit"></ToDoListItemDialog>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import { ToDoListItemEntity, ToDoListItemRequest, ToDoListKind } from '@/classes/ToDoListItem';
    import ToDoList from '../components/ToDoList.vue';
    import ToDoListItemDialog from '../components/dialogs/toDoList/ToDoListDialog.vue';
    import { ToDoListItemDialogType } from '@/classes/types/RefTypeInterfaces';
    import {importDefaults} from '@/compositions/Defaults';
    const { i18n, showErrorSnackbar, showSnackbar } = importDefaults();
    
    const toDoListDialog = ref<ToDoListItemDialogType>({} as ToDoListItemDialogType);
    const items = ref([] as ToDoListItemEntity[]);
    const url = '/to-do-list';

    onMounted(() => {
        getAllRecords();
    });
    const getAllRecords = () => {
        window.axios
            .post(`${url}/get-all`)
            .then((response) => {
                console.log(response);
                items.value = ToDoListItemEntity.listFromObjects(response.data);
            });            
    };
    const add = (toDoListItem: ToDoListItemRequest) => {
        window.axios
            .post(`${url}/add`, toDoListItem)
            .then((response) => {
                items.value.push(ToDoListItemEntity.fromObject(response.data));
                items.value.sort(ToDoListItemEntity.frontEndSortFunction());
                showSnackbar(i18n.t('successFeedback.added'),{timeout:1500,color:'success'});
            });          
    };

    const edit = (id: number, toDoListItemRequest: ToDoListItemRequest) => {
        let urgencyId = toDoListItemRequest.urgencyId;
        window.axios
            .put(`${url}/${id}`, toDoListItemRequest)
            .then((response) => {
                console.log(response.data);
                const index = items.value.findIndex((item) => item.id === id);
                if (urgencyId === response.data.urgencyId) {
                    items.value[index] = ToDoListItemEntity.fromObject(response.data);
                } else {
                    items.value[index] = ToDoListItemEntity.fromObject(response.data);
                    items.value.sort(ToDoListItemEntity.frontEndSortFunction());
                }
                showSnackbar(i18n.t('successFeedback.edited'),{timeout:1500,color:'success'});
            });         
    };
    const itemsChanged = (changedItems: ToDoListItemEntity[]) => {
        items.value = changedItems;
    };
</script>
