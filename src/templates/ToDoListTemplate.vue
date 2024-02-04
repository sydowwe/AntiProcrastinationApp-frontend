<template>
    <VRow justify="center" noGutters>
        <VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
            <VCard class="mx-auto rounded-lg pa-2 d-flex flex-column" max-width="600">
                <div class="d-flex flex-column align-center pb-1">
                    <VCardTitle>{{ $t('toDoList.toDoList') }}</VCardTitle>
                </div>
                <div class="d-flex justify-center mb-4">
                    <VBtn width="50%" color="green" @click="openDialog">{{ $t('toDoList.add') }}</VBtn>
                </div>
                <VList class="d-flex flex-column pa-0 ga-2 mx-3 mx-md-4 mx-lg-6 mb-4" density="compact" title="To do list" lines="three" select-strategy="classic" variant="tonal">
                    <ToDoListItem
                        v-for="item in items"
                        :toDoListItem="item"
                        :color="item.urgency.color"
                        @delete="deleteItem"
                        @edit="toDoListDialog.openEdit"
                        @select="select"
                        @un-select="unSelect"
                        @isDoneChanged="handleIsDoneChanged"
                    ></ToDoListItem>
                </VList>
            </VCard>
        </VCol>
    </VRow>
    <ToDoListItemDialog ref="toDoListDialog" @add="add" @edit="edit"></ToDoListItemDialog>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ToDoListItemEntity, ToDoListItemRequest } from '../classes/ToDoListItem';
import ToDoListItem from '../components/ToDoListItem.vue';
import ToDoListItemDialog from '../components/dialogs/toDoList/ToDoListDialog.vue';
import { ToDoListItemDialogType } from '../classes/types/RefTypeInterfaces';

const toDoListDialog = ref<ToDoListItemDialogType>({} as ToDoListItemDialogType);

const items = ref([] as ToDoListItemEntity[]);
const selectedItemsIds = ref([] as number[]);
const props = defineProps([''])


</script>