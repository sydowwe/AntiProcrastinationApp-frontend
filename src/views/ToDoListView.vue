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
			          @editItem="toDoListDialog?.openEdit"></ToDoList>
		</VCard>
	</VCol>
</VRow>
<ToDoListItemDialog ref="toDoListDialog" @add="add" @edit="edit" @quickEditedActivity="quickEditedActivity"></ToDoListItemDialog>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {ToDoListItemEntity, ToDoListItemRequest, ToDoListKind} from '@/classes/ToDoListItem';
import ToDoList from '../components/toDoList/ToDoList.vue';
import ToDoListItemDialog from '../components/dialogs/toDoList/ToDoListDialog.vue';
import type {ToDoListItemDialogType} from '@/classes/types/RefTypeInterfaces';
import {useI18n} from 'vue-i18n';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {API} from '@/plugins/axiosConfig.ts';

const i18n = useI18n();
const {showErrorSnackbar, showSnackbar} = useSnackbar();

const toDoListDialog = ref<ToDoListItemDialogType>({} as ToDoListItemDialogType);
const items = ref([] as ToDoListItemEntity[]);
const url = '/todo-list';

onMounted(() => {
	getAllRecords();
});
const getAllRecords = () => {
	API.get(`${url}`)
		.then((response) => {
			items.value = ToDoListItemEntity.listFromObjects(response.data);
		});
};
const add = (toDoListItem: ToDoListItemRequest) => {
	API.post(`${url}/create`, toDoListItem)
		.then((response) => {
			items.value.push(ToDoListItemEntity.fromJson(response.data));
			items.value.sort(ToDoListItemEntity.frontEndSortFunction());
			showSnackbar(i18n.t('successFeedback.added'), {timeout: 1500, color: 'success'});
		});
};

function quickEditedActivity(id: number, name: string, text: string | null) {
	const editedActivity = items.value[items.value.findIndex(item => item.id === id)];
	if (editedActivity) {
		editedActivity.activity.name = name;
		editedActivity.activity.text = text;
	}
}

const edit = (id: number, toDoListItemRequest: ToDoListItemRequest) => {
	let taskUrgencyId = toDoListItemRequest.taskUrgencyId;
	const beforeEditEntity = items.value.find(item => item.id === id);
	if (beforeEditEntity && (beforeEditEntity.taskUrgency.id !== toDoListItemRequest.taskUrgencyId || beforeEditEntity.activity.id !== toDoListItemRequest.activityId)) {
		API.put(`${url}/update/${id}`, toDoListItemRequest)
			.then((response) => {
				console.log(response.data);
				const index = items.value.findIndex((item) => item.id === id);
				if (taskUrgencyId === response.data.taskUrgencyId) {
					items.value[index] = ToDoListItemEntity.fromJson(response.data);
				} else {
					items.value[index] = ToDoListItemEntity.fromJson(response.data);
					items.value.sort(ToDoListItemEntity.frontEndSortFunction());
				}
				showSnackbar(i18n.t('successFeedback.edited'), {timeout: 1500, color: 'success'});
			});
	}
};
const itemsChanged = (changedItems: ToDoListItemEntity[]) => {
	items.value = changedItems;
};
</script>
