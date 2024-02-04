<template>
    <div class="d-flex justify-center mb-4">
        <VBtn width="50%" color="green" @click="toDoListDialog.openCreate()">{{ $t('toDoList.add') }}</VBtn>
    </div>
    <VRow justify="center" noGutters>
        <VCol cols="12" sm="10" md="4" lg="3" class="mt-lg-5 mt-md-3">
            <VCard class="mx-auto rounded-lg pa-2 d-flex flex-column" max-width="600">
                <div class="d-flex flex-column align-center pb-1">
                    <VCardTitle>{{ $t('toDoList.toDoList') }}</VCardTitle>
                </div>
                <ToDoList :kind="ToDoListKind.ROUTINE" :items="items" @itemsChanged="itemsChanged" @editItem="toDoListDialog.openEdit"></ToDoList>
            </VCard>
        </VCol>
    </VRow>
    <RoutineToDoListDialog ref="toDoListDialog" @add="add" @edit="edit"></RoutineToDoListDialog>
</template>
<script setup lang="ts">
    import RoutineToDoListDialog from '../components/dialogs/toDoList/RoutineToDoListDialog.vue';
    import ToDoList from '../components/ToDoList.vue';
    import { ref, watch, onMounted } from 'vue';
    import { RoutineToDoListItemEntity, RoutineToDoListItemRequest, ToDoListKind } from '../classes/ToDoListItem';
    import { RoutineToDoListItemDialogType } from '../classes/types/RefTypeInterfaces';
    const items = ref([] as RoutineToDoListItemEntity[]);
    const toDoListDialog = ref<RoutineToDoListItemDialogType>({} as RoutineToDoListItemDialogType);
    const url = '/routine-to-do-list';

    onMounted(() => {
        getAllRecords();
    });

    const getAllRecords = () => {
        window.axios
            .post(`${url}/get-all`)
            .then((response) => {
                items.value = RoutineToDoListItemEntity.listFromObjects(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const add = (toDoListItem: RoutineToDoListItemRequest) => {
        window.axios
            .post(`${url}/add`, toDoListItem)
            .then((response) => {
                items.value.push(RoutineToDoListItemEntity.fromObject(response.data));
                items.value = RoutineToDoListItemEntity.frontEndSort(items.value);
            })
            .catch((error) => {
                console.error(error);
            });
    };
    const edit = (id: number, toDoListItemRequest: RoutineToDoListItemRequest) => {
        let urgencyId = toDoListItemRequest.timePeriodId;
        window.axios
            .put(`${url}/${id}`, toDoListItemRequest)
            .then((response) => {
                console.log(response.data);
                const index = items.value.findIndex((item) => item.id === id);
                if (urgencyId === response.data.urgencyId) {
                    items.value[index] = RoutineToDoListItemEntity.fromObject(response.data);
                } else {
                    items.value[index] = RoutineToDoListItemEntity.fromObject(response.data);
                    items.value = RoutineToDoListItemEntity.frontEndSort(items.value);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };
    const itemsChanged = (changedItems: RoutineToDoListItemEntity[]) => {
        items.value = changedItems;
    };
</script>
