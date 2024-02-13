<template>
    <VRow justify="center" class="mt-lg-5 mt-md-3">
        <VCol cols="12" sm="10" md="4" lg="3" class="d-flex justify-center">
            <VBtn width="100%" color="green" @click="toDoListDialog.openCreate()">{{ $t('toDoList.add') }}</VBtn>
        </VCol>
    </VRow>
    <VRow justify="center">
        <VCol cols="12" sm="10" md="4" lg="3" class="px-2" v-for="group in groupedItems">
            <VCard class="mx-auto rounded-lg px-3 d-flex flex-column" max-width="600">
                <div class="d-flex justify-center pb-1">
                    <VCardTitle>{{ group.timePeriod.text }}</VCardTitle>
                </div>
                <ToDoList
                    :kind="ToDoListKind.ROUTINE"
                    :items="group.items"
                    :color="group.timePeriod.color"
                    @itemsChanged="itemsChanged"
                    @editItem="toDoListDialog.openEdit"
                ></ToDoList>
            </VCard>
        </VCol>
    </VRow>
    <RoutineToDoListDialog ref="toDoListDialog" @add="add" @edit="edit"></RoutineToDoListDialog>
</template>
<script setup lang="ts">
    import RoutineToDoListDialog from '../components/dialogs/toDoList/RoutineToDoListDialog.vue';
    import ToDoList from '../components/ToDoList.vue';
    import { ref, watch, onMounted } from 'vue';
    import { RoutineToDoListItemEntity, RoutineToDoListGroupedList, RoutineToDoListItemRequest, ToDoListKind } from '../classes/ToDoListItem';
    import { RoutineToDoListItemDialogType } from '../classes/types/RefTypeInterfaces';
    const groupedItems = ref([] as RoutineToDoListGroupedList[]);
    const toDoListDialog = ref<RoutineToDoListItemDialogType>({} as RoutineToDoListItemDialogType);
    const url = '/routine-to-do-list';

    onMounted(() => {
        getAllRecords();
    });

    const getAllRecords = () => {
        window.axios
            .post(`${url}/get-all`)
            .then((response) => {
                groupedItems.value = RoutineToDoListGroupedList.listFromObjects(response.data);
            })            
    };

    const add = (toDoListItem: RoutineToDoListItemRequest) => {
        window.axios
            .post(`${url}/add`, toDoListItem)
            .then((response) => {
                const updatedList = groupedItems.value.find((group) => group.timePeriod.id === toDoListItem.timePeriodId)?.items;
                if (updatedList) {
                    updatedList.push(RoutineToDoListItemEntity.fromObject(response.data));
                    updatedList.sort((a, b) => a.id - b.id);
                } else {
                    console.error('not found group');
                }
            })           
    };
    const edit = (id: number, toDoListItemRequest: RoutineToDoListItemRequest) => {
        window.axios
            .put(`${url}/${id}`, toDoListItemRequest)
            .then((response) => {
                const updatedItem = RoutineToDoListItemEntity.fromObject(response.data);
                const oldGroup = groupedItems.value.find((group) => {
                    return group.items.some((item) => item.id === id);
                });
                const updatedList = groupedItems.value.find((group) => group.timePeriod.id === updatedItem.timePeriod.id)?.items;
                if (oldGroup) {
                    if (updatedList) {
                        if (updatedItem.timePeriod.id === oldGroup?.timePeriod.id) {
                            updatedList[updatedList.findIndex((item) => item.id === updatedItem.id)] = updatedItem;
                        } else {
                            oldGroup.items = oldGroup?.items.filter((item) => item.id !== updatedItem.id);
                            updatedList.push(updatedItem);
                        }
                    } else {
                        console.error('not found updated group list');
                    }
                } else {
                    console.error('not found old group');
                }
            })           
    };
    const itemsChanged = (changedItems: RoutineToDoListItemEntity[]) => {
        console.log(changedItems);
        groupedItems.value = groupedItems.value.map((group) => ({
            ...group,
            items: group.items.filter((item) => changedItems.some((changedItem) => changedItem.id === item.id)),
        }));
    };
</script>
