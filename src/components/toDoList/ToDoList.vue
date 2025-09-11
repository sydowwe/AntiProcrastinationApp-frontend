<template>
<VList class="d-flex flex-column pa-0 ga-2" density="compact" title="To do list" lines="three" select-strategy="classic"
       variant="tonal">
	<ToDoListItem
		v-for="item in items"
		:key="item.id"
		:toDoListItem="item"
		:color="item.taskUrgency?.color ?? 'primary'"
		@delete="deleteItem"
		@edit="editItem"
		@select="select"
		@un-select="unSelect"
		@isDoneChanged="handleIsDoneChanged"
	></ToDoListItem>
</VList>
<ToDoListItemDoneDialog v-model="itemDoneDialogShown" :toDoListItem="currentDoneItem" :isRecursive="isDialogRecursive"
                        @openNext="recursiveDialogsToSaveToHistory"></ToDoListItemDoneDialog>
</template>
<script setup lang="ts" generic="TEntity extends BaseToDoListItemEntity">
import ToDoListItem from './ToDoListItem.vue';
import ToDoListItemDoneDialog from '@/components/dialogs/toDoList/ToDoListItemDoneDialog.vue';
import {type BaseToDoListItemEntity, ToDoListKind} from '@/classes/ToDoListItem';
import {ref} from 'vue';
import {API} from '@/plugins/axiosConfig.ts';

const props = defineProps({
	kind: {
		type: Number,
		default: ToDoListKind.NORMAL,
	},
	items: {
		type: Array as () => TEntity[],
		required: true,
	},
});
const selectedItemsIds = ref([] as number[]);
const editItem = (entityToEdit: TEntity) => {
	emit('editItem', entityToEdit);
};
const url = (props.kind === ToDoListKind.ROUTINE ? 'routine-' : '') + 'todo-list';

const itemDoneDialogShown = ref(false);
const isDialogRecursive = ref(false);
const changedItems = ref([] as TEntity[]);
const currentDoneItem = ref({} as TEntity);

function recursiveDialogsToSaveToHistory() {
	if (changedItems.value.length > 0) {
		isDialogRecursive.value = true;
		currentDoneItem.value = changedItems.value[0];
		itemDoneDialogShown.value = true;
		changedItems.value.splice(0, 1);
	}
}

const handleIsDoneChanged = (toDoListItem: BaseToDoListItemEntity) => {
	const isBatchAction = selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(toDoListItem.id);
	if (toDoListItem.isDone) {
		if (isBatchAction) {
			changedItems.value = props.items.filter((item: BaseToDoListItemEntity) => selectedItemsIds.value.includes(item.id));
			recursiveDialogsToSaveToHistory();
		} else {
			currentDoneItem.value = toDoListItem;
			isDialogRecursive.value = false;
			itemDoneDialogShown.value = true;
		}
	}
	const request = {idList: isBatchAction ? selectedItemsIds : [toDoListItem.id]};
	API.patch(`/${url}/toggle-is-done`, request)
		.then((response) => {
			if (isBatchAction) {
				emit('itemsChanged', selectedItemsIds.value);
				selectedItemsIds.value = [];
			}else{
				emit('itemsChanged', [toDoListItem.id]);
			}
		})
		.catch((error) => {
			console.error(error);
		});
};
const deleteItem = (id: number) => {
	if (selectedItemsIds.value.length > 1) {
		const batchDeleteIds = selectedItemsIds.value.map((id: number) => id)
		emit('batchDeletedItems', batchDeleteIds);
	} else {
		emit('deletedItem', id)
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
const emit = defineEmits<{
	(e: 'itemsChanged', changedItems: number[]): void;
	(e: 'editItem', entityToEdit: BaseToDoListItemEntity): void;
	(e: 'deletedItem', id: number): void;
	(e: 'batchDeletedItems', ids: number[]): void;
}>();
</script>
