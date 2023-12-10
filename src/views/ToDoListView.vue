<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
                <v-card class="mx-auto" max-width="400">
                    <div class="d-flex flex-column align-center">
                        <VCardTitle class="pb-0">{{ $t('toDoList.toDoList') }}</VCardTitle>
                    </div>
                    <v-list class="pt-2" density="compact" title="To do list" lines="three" select-strategy="classic" variant="tonal">
                        <ToDoListItem v-for="item in items" :toDoListItem="item" @delete="delete" @edit="openEditDialog"></ToDoListItem>
                    </v-list>
                    <div class="d-flex justify-center mb-4">
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
    import { ToDoListItemEntity } from '../classes/ToDoListItemEntity';
    import { ToDoListItemDTO } from '../classes/DTOs/ToDoListItemDTO';
    import ToDoListItemDialog from '../components/dialogs/ToDoListItemDialog.vue';

    export default defineComponent({
        components: {
            ToDoListItem,
            ToDoListItemDialog,
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
                        console.log(response.data);
                        this.items = response.data as ToDoListItemEntity[];
                        console.log(this.items);
                    })
                    .catch((error) => {});
            },
            openAddDialog() {
                (this.$refs.toDoListItemDialog as { openDialog(editedToDoListItem: ToDoListItemDTO | null): () => void }).openDialog(null);
            },
            openEditDialog(editedToDoListItem: ToDoListItemEntity) {
                let toDoListItemDTO = ToDoListItemDTO.fromEntity(editedToDoListItem);
                (this.$refs.toDoListItemDialog as { openDialog(editedToDoListItem: ToDoListItemDTO | null, id: number): () => void }).openDialog(toDoListItemDTO, editedToDoListItem.id);
            },
            add(toDoListItem: ToDoListItemDTO) {
                window.axios
                    .post(`/to-do-list/add`, toDoListItem)
                    .then((response) => {
                        console.log(response);
                        console.log(response.data);
                        this.items.push(response.data as ToDoListItemEntity);
                    })
                    .catch((error) => {});
            },
            edit(id: number, toDoListItem: ToDoListItemDTO) {
                console.log(id);
                console.log(toDoListItem);
                window.axios
                    .put(`/to-do-list/${id}`, toDoListItem)
                    .then((response) => {
                        console.log(response.data);
                        this.items[this.items.findIndex((item) => item.id === id)] = response.data as ToDoListItemEntity;
                    })
                    .catch((error) => {});
            },
            delete(id: number) {
                console.log('asdsad');
                console.log('id: ' + id);
                window.axios
                    .delete(`/to-do-list/${id}`)
                    .then((response) => {
                        console.log(response.data);
                    })
                    .catch((error) => {});
                this.items = this.items.filter((item: ToDoListItemEntity) => item.id !== id);
            },
            select(id: number) {
                this.selectedItemsIds.push(id);
            },
            unSelect(id: number) {
                this.selectedItemsIds = this.selectedItemsIds.filter((item) => item !== id);
            },
        },
    });
</script>
