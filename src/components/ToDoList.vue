<template>
    <VList class="d-flex flex-column pa-0 ga-2 mb-4" density="compact" title="To do list" lines="three" select-strategy="classic" variant="tonal">
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
    import { BaseToDoListItemEntity, ToDoListKind } from '@/classes/ToDoListItem';
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
        if (selectedItemsIds.value.length > 1) {
            const batchDeleteIds = selectedItemsIds.value.map((item: number) => ({ id: item }));
            window.axios
                .post(`/${url}/batch-delete`, batchDeleteIds)
                .then((response) => {
                    console.log(response.data);
                    if (response.data.status === 'success') {
                        emit(
                            'itemsChanged',
                            props.items.filter((item: BaseToDoListItemEntity) => !selectedItemsIds.value.includes(item.id))
                        );
                        selectedItemsIds.value = [];
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
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
        }
    };

    const handleIsDoneChanged = (id: number, isDone: boolean) => {
        const changedItems = selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(id) ?
            selectedItemsIds.value.map((item: number) => ({ id: item })) : [{ id }];
        console.log(changedItems);

        window.axios
            .patch(`/${url}/change-done`, changedItems)
            .then((response) => {
                console.log(response);
                if(selectedItemsIds.value.includes(id)){
                    props.items.forEach((item) => {
                        if (selectedItemsIds.value.includes(item.id)) {
                            item.isDone = isDone;
                        }
                    });
                }
                selectedItemsIds.value = [];
            })
            .catch((error) => {
                console.error(error);
            });
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
    // const emit = defineEmits<{
    //     (e: 'itemsChanged', changedItems: BaseToDoListItemEntity[]): void;
    //     (e: 'editItem', entityToEdit: BaseToDoListItemEntity): void;
    // }>();
    const emit = defineEmits(['itemsChanged', 'editItem']);
</script>
