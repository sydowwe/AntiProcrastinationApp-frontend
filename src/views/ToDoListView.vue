<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="8" lg="4" class="mt-lg-5 mt-md-3">
		<div class="d-flex justify-center mb-4 ga-2">
			<VBtn class="flex-grow-1" color="primary" @click="toDoListDialog?.openCreate" :disabled="isInChangeOrderMode">{{ $t('toDoList.add') }}</VBtn>
			<VIconBtn
				color="secondary"
				:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
				@click="toggleChangeOrderMode"
				density="comfortable"
				icon="arrows-up-down"
			></VIconBtn>
		</div>
		<VCard class="mx-auto rounded-lg pt-3 pb-2 d-flex flex-column px-6 px-md-4 px-lg-6">
			<div class="d-flex flex-column align-center">
				<VCardTitle class="pb-1">{{ isInChangeOrderMode ? $t('toDoList.changeOrder') : $t('toDoList.toDoList') }}</VCardTitle>
			</div>
			<ToDoList
				:kind="ToDoListKind.NORMAL"
				:items
				:isInChangeOrderMode
				:listId="1"
				@itemsChanged="itemsChanged"
				@editItem="toDoListDialog?.openEdit"
				@deletedItem="deleteItem"
				@itemsReordered="handleOrderChange"
			></ToDoList>
		</VCard>
	</VCol>
</VRow>
<ToDoListItemDialog ref="toDoListDialog" @add="add" @edit="edit" @quickEditedActivity="quickEditedActivity" @changedUrgency="onChangedUrgency"></ToDoListItemDialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {ChangeDisplayOrderRequest} from '@/dtos/request/ChangeDisplayOrderRequest';
import {TodoListItemEntity} from '@/dtos/response/TodoListItemEntity';
import {ToDoListItemRequest} from '@/dtos/request/ToDoListItemRequest';
import {ToDoListKind} from '@/dtos/enum/ToDoListKind';
import ToDoList from '../components/toDoList/ToDoList.vue';
import ToDoListItemDialog from '../components/dialogs/toDoList/ToDoListDialog.vue';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useActivityCrud, useTaskPriorityCrud, useTodoListItemCrud} from '@/composables/ConcretesCrudComposable.ts';
import {hasObjectChanged} from '@/scripts/helperMethods.ts';

const {fetchById: fetchByIdActivity} = useActivityCrud()
const {createWithResponse, update, deleteEntity, fetchAll, fetchById, changeUrgency, changeDisplayOrder} = useTodoListItemCrud()
const {fetchById: fetchByIdTaskUrgency} = useTaskPriorityCrud()

const i18n = useI18n();
const {showErrorSnackbar, showSuccessSnackbar} = useSnackbar();

const props = defineProps<{
	listId?: number;
}>();

const toDoListDialog = ref<InstanceType<typeof ToDoListItemDialog>>();
const items = ref([] as TodoListItemEntity[]);
const isInChangeOrderMode = ref(false);

onMounted(async () => {
	items.value = await fetchAll();
});

function toggleChangeOrderMode() {
	isInChangeOrderMode.value = !isInChangeOrderMode.value;
}

async function handleOrderChange(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) {
	// Perform the reorder immediately for UI responsiveness
	const [movedItem] = items.value.splice(oldIndex, 1);
	if (movedItem) {
		items.value.splice(newIndex, 0, movedItem);
	}

	console.log('Items reordered:', {oldIndex, newIndex, newOrder: items.value.map(item => item.id)});

	await changeDisplayOrder(request)
}

// ... existing code for other methods ...
async function add(toDoListItem: ToDoListItemRequest) {
	const response = await createWithResponse(toDoListItem);
	items.value.push(response);
	items.value.sort(TodoListItemEntity.frontEndSortFunction());
	showSuccessSnackbar(i18n.t('successFeedback.added'));
}

async function quickEditedActivity(id: number) {
	const toDoList = items.value[items.value.findIndex(item => item.id === id)];
	if (toDoList) {
		toDoList.activity = await fetchByIdActivity(id);
	}
}

async function edit(id: number, toDoListItemRequest: ToDoListItemRequest) {
	const beforeEditEntity = items.value.find(item => item.id === id);
	if (beforeEditEntity && hasObjectChanged(ToDoListItemRequest.fromEntity(beforeEditEntity), toDoListItemRequest)) {
		await update(id, toDoListItemRequest);
		await updateAfterEdit(id, beforeEditEntity.taskPriority.id);
		showSuccessSnackbar(i18n.t('successFeedback.edited'));
	}
}

async function onChangedUrgency(id: number, taskPriorityId?: number) {
	if (!taskPriorityId) {
		showErrorSnackbar(i18n.t('errorFeedback.noUrgencySelected'));
		return;
	}
	changeUrgency(id, taskPriorityId).then(async () => {
		const item = items.value.find(i => i.id === id);
		if (item) {
			item.taskPriority = await fetchByIdTaskUrgency(taskPriorityId);
		}
	});
}

async function deleteItem(id: number) {
	await deleteEntity(id);
	const index = items.value.findIndex((item) => item.id === id);
	if (index !== -1) {
		items.value.splice(index, 1);
	}
}

async function updateAfterEdit(id: number, oldTaskUrgencyId?: number) {
	const updatedItem = await fetchById(id)
	const index = items.value.findIndex((item) => item.id === id);
	if (oldTaskUrgencyId === updatedItem.taskPriority.id) {
		items.value[index] = updatedItem;
	} else {
		items.value[index] = updatedItem;
		items.value.sort(TodoListItemEntity.frontEndSortFunction());
	}
}

async function itemsChanged(changedItems: number[]) {
	if (changedItems.length === 1 && changedItems[0]) {
		await updateAfterEdit(changedItems[0]);
	} else {
		items.value = await fetchAll();
	}
}
</script>