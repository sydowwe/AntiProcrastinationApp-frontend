<template>
    <VList class="d-flex flex-column pa-0 ga-2 mx-3 mx-md-4 mx-lg-6 mb-4" density="compact" title="To do list" lines="three" select-strategy="classic" variant="tonal">
        <ToDoListItem
            v-for="item in items"
            :toDoListItem="item"
            :color="color ?? item.urgency.color"
            @delete="deleteItem"
            @edit="editItem"
            @select="select"
            @un-select="unSelect"
            @isDoneChanged="handleIsDoneChanged"
        ></ToDoListItem>
    </VList>
</template>
<script setup lang="ts">
    import ToDoListItem from '../components/ToDoListItem.vue';
    import { BaseToDoListItemEntity, ToDoListKind } from '../classes/ToDoListItem';
    import { ref } from 'vue';

    const props = defineProps({
        kind: {
            type: Number,
            default: ToDoListKind.NORMAL,
        },
        items: {
            type: Array as () => BaseToDoListItemEntity[],
            required: true,
        },
        color: {
            type: String,
            required: false,
        },
    });
    const selectedItemsIds = ref([] as number[]);

    const editItem = (entityToEdit: BaseToDoListItemEntity) => {
        emit('editItem', entityToEdit);
    };
    const url = (props.kind === ToDoListKind.ROUTINE ? 'routine-' : '') + 'to-do-list';
    const deleteItem = (id: number) => {
        window.axios
            .delete(`/${url}/${id}`)
            .then((response) => {
                console.log(response.data);
                emit(
                    'itemsChanged',
                    props.items.filter((item: BaseToDoListItemEntity) => item.id !== id)
                );
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleIsDoneChanged = (id: number, isDone: boolean) => {
        if (selectedItemsIds.value.length > 1) {
            const batchChangeDone = selectedItemsIds.value.map((item: number) => ({ id: item, isDone }));
            window.axios
                .post(`/${url}/batch-change-done`, batchChangeDone)
                .then((response) => {
                    console.log(response);
                    props.items.forEach((item) => {
                        if (selectedItemsIds.value.includes(item.id)) {
                            item.isDone = isDone;
                        }
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
            console.log({ id, isDone });
            window.axios
                .post(`/${url}/change-done`, JSON.stringify({ id, isDone }))
                .then((response) => {
                    console.log(response);
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    };
    const select = (id: number) => {
        if (!selectedItemsIds.value.includes(id)) {
            selectedItemsIds.value.push(id);
        }
    };
    const unSelect = (id: number) => {
        console.log('asdsd');
        selectedItemsIds.value = selectedItemsIds.value.filter((item) => item != id);
    };
    const emit = defineEmits(['itemsChanged', 'editItem']);
</script>
