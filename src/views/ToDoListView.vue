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
import ToDoListItemDialog from '../components/dialogs/ToDoListItemDialog.vue';
import { ToDoListItemDialogType } from '../classes/types/RefTypeInterfaces';

const toDoListDialog = ref<ToDoListItemDialogType>({} as ToDoListItemDialogType);

const items = ref([] as ToDoListItemEntity[]);
const selectedItemsIds = ref([] as number[]);

onMounted(() => {
  getAllRecords();
});

const getAllRecords = () => {
  window.axios
    .post(`/to-do-list/get-all`)
    .then((response) => {
      items.value = ToDoListItemEntity.listFromObjects(response.data);
    })
    .catch((error) => {
      console.error(error);
    });
};

const openDialog = () => {
  toDoListDialog.value.openCreate();
};

const add = (toDoListItem: ToDoListItemRequest) => {
  window.axios
    .post(`/to-do-list/add`, toDoListItem)
    .then((response) => {
      items.value.push(ToDoListItemEntity.fromObject(response.data));
      items.value = ToDoListItemEntity.frontEndSort(items.value);
    })
    .catch((error) => {
      console.error(error);
    });
};

const edit = (id: number, toDoListItemRequest: ToDoListItemRequest) => {
  let urgencyId = toDoListItemRequest.urgencyId;
  window.axios
    .put(`/to-do-list/${id}`, toDoListItemRequest)
    .then((response) => {
      console.log(response.data);
      const index = items.value.findIndex((item) => item.id === id);
      if (urgencyId === response.data.urgencyId) {
        items.value[index] = ToDoListItemEntity.fromObject(response.data);
      } else {
        items.value[index] = ToDoListItemEntity.fromObject(response.data);
        items.value = ToDoListItemEntity.frontEndSort(items.value);
      }
    })
    .catch((error) => {
      console.error(error);
    });
};

const deleteItem = (id: number) => {
  window.axios
    .delete(`/to-do-list/${id}`)
    .then((response) => {
      console.log(response.data);
      items.value = items.value.filter((item: ToDoListItemEntity) => item.id !== id);
    })
    .catch((error) => {
      console.error(error);
    });
};

const select = (id: number) => {
    if(!selectedItemsIds.value.includes(id)){
        selectedItemsIds.value.push(id);
    }
  console.log(selectedItemsIds.value);
};

const unSelect = (id: number) => {
    console.log("asdsd");
    selectedItemsIds.value = selectedItemsIds.value.filter((item) => item != id);
};

const handleIsDoneChanged = (id: number, isDone: boolean) => {
  if (selectedItemsIds.value.length > 1) {
    const batchChangeDone = selectedItemsIds.value.map((item: number) => ({ id: item, isDone }));
    window.axios
      .post(`/to-do-list/batch-change-done`, batchChangeDone)
      .then((response) => {
        console.log(response);
        items.value.forEach((item) => {
          if (selectedItemsIds.value.includes(item.id)) {
            item.isDone = isDone;
          }
        });
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    window.axios
      .post(`/to-do-list/change-done`, { id, isDone })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
      });
  }
};
</script>