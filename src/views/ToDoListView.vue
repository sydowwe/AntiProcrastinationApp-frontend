<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<VCard class="mx-auto rounded-lg pa-2 d-flex flex-column px-3 px-md-4 px-lg-6" max-width="600">
			<div class="d-flex flex-column align-center pb-1">
				<VCardTitle>{{ $t('toDoList.toDoList') }}</VCardTitle>
			</div>
			<div class="d-flex justify-center mb-4">
				<VBtn width="50%" color="green" @click="toDoListDialog?.openCreate">{{ $t('toDoList.add') }}</VBtn>
			</div>
			<ToDoList :kind="ToDoListKind.NORMAL" :items="items" @itemsChanged="itemsChanged"
			          @editItem="toDoListDialog?.openEdit" @deletedItem="deleteItem"></ToDoList>
		</VCard>
	</VCol>
</VRow>
<ToDoListItemDialog ref="toDoListDialog" @add="add" @edit="edit" @quickEditedActivity="quickEditedActivity"></ToDoListItemDialog>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {RoutineTodoListItemEntity, RoutineTodoListItemRequest, TodoListItemEntity, ToDoListItemRequest, ToDoListKind} from '@/classes/ToDoListItem';
import ToDoList from '../components/toDoList/ToDoList.vue';
import ToDoListItemDialog from '../components/dialogs/toDoList/ToDoListDialog.vue';
import type {ToDoListItemDialogType} from '@/classes/types/RefTypeInterfaces';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {useEntityCommand} from '@/composables/general/CrudComposition.ts';
import {useTodoListItemCrud} from '@/composables/general/ConcretesCrudComposable.ts';

const {createWithResponse, update, deleteEntity, fetchAll } = useTodoListItemCrud()

const i18n = useI18n();
const {showErrorSnackbar, showSnackbar} = useSnackbar();

const toDoListDialog = ref<ToDoListItemDialogType>({} as ToDoListItemDialogType);
const items = ref([] as TodoListItemEntity[]);
const url = '/todo-list';

onMounted(async () => {
	items.value = await fetchAll();
});

async function add(toDoListItem: ToDoListItemRequest){
	const response = await createWithResponse(toDoListItem);
	items.value.push(response);
	items.value.sort(TodoListItemEntity.frontEndSortFunction());
	showSnackbar(i18n.t('successFeedback.added'), {timeout: 1500, color: 'success'});
}

function quickEditedActivity(id: number, name: string, text: string | null) {
	const editedActivity = items.value[items.value.findIndex(item => item.id === id)];
	if (editedActivity) {
		editedActivity.activity.name = name;
		editedActivity.activity.text = text;
	}
}

async function edit(id: number, toDoListItemRequest: ToDoListItemRequest){
	let taskUrgencyId = toDoListItemRequest.taskUrgencyId;
	const beforeEditEntity = items.value.find(item => item.id === id);
	if (beforeEditEntity && (beforeEditEntity.taskUrgency.id !== toDoListItemRequest.taskUrgencyId || beforeEditEntity.activity.id !== toDoListItemRequest.activityId)) {
		const response = await update(id, toDoListItemRequest);
		const index = items.value.findIndex((item) => item.id === id);
		if (taskUrgencyId === response.taskUrgency.id) {
			items.value[index] = response;
		} else {
			items.value[index] = response;
			items.value.sort(TodoListItemEntity.frontEndSortFunction());
		}
		showSnackbar(i18n.t('successFeedback.edited'), {timeout: 1500, color: 'success'});
	}
}

async function deleteItem(id: number) {
	await deleteEntity(id);
	const index = items.value.findIndex((item) => item.id === id);
	if (index !== -1) {
		items.value.splice(index, 1);
	}
}

const itemsChanged = (changedItems: TodoListItemEntity[]) => {
	items.value = changedItems;
};
</script>
