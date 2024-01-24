<!-- <template>
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
<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useUserStore } from '../plugins/stores/userStore';
    import ToDoListItem from '../components/ToDoListItem.vue';
    import ToDoListItemDialog from '../components/dialogs/ToDoListItemDialog.vue';
import { ToDoListItemEntity } from '../classes/ToDoListItem';
    export default defineComponent({
        components: { ToDoListItem,
            ToDoListItemDialog, },
        setup() {
            // const form = ref<>({} as);
            // return { form };
        },
        props: {
            email: {
                type: String,
                required: true,
            },            
        },
        data() {
            return {
                loading: false,
                error: false,
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
                        this.items = ToDoListItemEntity.listFromObjects(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            },
            openDialog() {
                this.toDoListDialog.openCreate();
            },
            add(toDoListItem: ToDoListItemRequest) {
                window.axios
                    .post(`/to-do-list/add`, toDoListItem)
                    .then((response) => {
                        this.items.push(ToDoListItemEntity.fromObject(response.data));
                        this.items = ToDoListItemEntity.frontEndSort(this.items);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            },
            edit(id: number, toDoListItemRequest: ToDoListItemRequest) {
                let urgencyId = toDoListItemRequest.urgencyId;
                window.axios
                    .put(`/to-do-list/${id}`, toDoListItemRequest)
                    .then((response) => {
                        console.log(response.data);
                        if (urgencyId === response.data.urgencyId) {
                            this.items[this.items.findIndex((item) => item.id === id)] = ToDoListItemEntity.fromObject(response.data);
                        } else {
                            this.items[this.items.findIndex((item) => item.id === id)] = ToDoListItemEntity.fromObject(response.data);
                            this.items = ToDoListItemEntity.frontEndSort(this.items);
                        }
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
            handleIsDoneChanged(id: number, isDone: boolean) {
                if (this.selectedItemsIds.length > 1) {
                    const batchChangeDone = this.selectedItemsIds.map((item: number) => ({ id: item, isDone }));
                    window.axios
                        .post(`/to-do-list/batch-change-done`, batchChangeDone)
                        .then((response) => {
                            console.log(response);
                            this.items.forEach((item) => {
                                if (this.selectedItemsIds.includes(item.id)) {
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
            },
        },
        },
    });
</script> -->