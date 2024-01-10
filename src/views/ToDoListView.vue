<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <v-card class="mx-auto" max-width="400">
                    <div class="d-flex flex-column align-center ">
                        <VCardTitle>{{ $t('toDoList.toDoList') }}</VCardTitle>
                    </div>
                    <v-list class="py-0 px-3 px-md-4" density="compact" title="To do list" lines="three" select-strategy="classic" variant="tonal">
                        <ToDoListItem v-for="item in items" :toDoListItem="item" @delete="deleteItem" @edit="openEditDialog" @select="select" @un-select="unSelect"></ToDoListItem>
                    </v-list>
                    <div class="d-flex justify-center pa-4">
                        <VBtn width="70%" color="green" @click="openAddDialog">{{ $t('toDoList.add') }}</VBtn>
                    </div>
                </v-card>
            </v-col>
        </v-row>
        <ToDoListItemDialog ref="toDoListItemDialog" @add="add" @edit="edit"></ToDoListItemDialog>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import ToDoListItem from '../components/ToDoListItem.vue';
    import { ToDoListItemEntity, ToDoListItemRequest } from '../classes/ToDoListItemEntity';
    import ToDoListItemDialog from '../components/dialogs/ToDoListItemDialog.vue';

    export default defineComponent({
        components: {
            ToDoListItem,
            ToDoListItemDialog            
        },
        data() {
            return {
                items: [] as ToDoListItemEntity[],
                selectedItemsIds: [] as number[],
            };
        },
        created() {
            this.getAllRecords();
        },
        methods: {
            getAllRecords() {
                window.axios
                    .post(`/to-do-list/get-all`)
                    .then((response) => {
                        this.items = response.data.map((item:any)=>ToDoListItemEntity.fromObject(item));
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            },
            openAddDialog() {                
                (this.$refs.toDoListItemDialog as { open(editedToDoListItem: ToDoListItemRequest | null): () => void }).open(null);
            },
            openEditDialog(editedToDoListItem: ToDoListItemEntity) {
                let toDoListItemRequest = ToDoListItemRequest.fromEntity(editedToDoListItem);
                (this.$refs.toDoListItemDialog as { open(id: number,editedToDoListItem: ToDoListItemRequest | null ): () => void }).open(editedToDoListItem.id,toDoListItemRequest);
            },
            add(toDoListItem: ToDoListItemRequest) {
                window.axios
                    .post(`/to-do-list/add`, toDoListItem)
                    .then((response) => {
                        console.log(response);
                        console.log(response.data);
                        this.items.push(ToDoListItemEntity.fromObject(response.data))
                    })
                    .catch((error) => {
                        console.error(error);                        
                    });
            },
            edit(id: number, toDoListItemRequest: ToDoListItemRequest) {
                console.log(id);
                console.log(toDoListItemRequest);
                window.axios
                    .put(`/to-do-list/${id}`, toDoListItemRequest)
                    .then((response) => {
                        console.log(response.data);
                        this.items[this.items.findIndex((item) => item.id === id)] = ToDoListItemEntity.fromObject(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            },
            deleteItem(id: number) {
                window.axios
                    .delete(`/to-do-list/${id}`)
                    .then((response) => {
                        console.log(response.data);
                        this.items = this.items.filter((item: ToDoListItemEntity) => item.id !== id);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            },
            select(id: number) {
                this.selectedItemsIds.push(id);
                console.log(this.selectedItemsIds);                
            },
            unSelect(id: number) {
                this.selectedItemsIds = this.selectedItemsIds.filter((item) => item !== id);
            },
        },
    });
</script>
