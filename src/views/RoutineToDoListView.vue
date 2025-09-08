<template>
<div class="h-100 w-100 d-flex flex-column">
	<VRow justify="center" class="mt-lg-5 mt-md-3 position-sticky">
		<VCol cols="12" sm="10" md="4" lg="3" class="d-flex justify-center">
			<VBtn width="100%" color="green" @click="toDoListDialog.openCreate()">{{ $t('toDoList.add') }}</VBtn>
		</VCol>
	</VRow>
	<VRow class="flex-grow-1 h-100 overflow-y-auto" justify="center">
		<VCol class="px-2 h-auto" :md="shownGroups.length % 2 == 0 ? 6 : undefined" :lg="shownGroups.length > 2 ? 3 : undefined"
		      v-for="group in shownGroups">
			<VCard class="mx-auto rounded-lg px-3 d-flex flex-column" min-width="350">
				<VRow class="py-1" noGutters>
					<VCol class="d-flex"></VCol>
					<VCol class="d-flex">
						<VCardTitle class="mx-auto">{{ group.timePeriod.text }}</VCardTitle>
					</VCol>
					<VCol class="d-flex">
						<VBtn color="blue" density="comfortable" class="my-auto ml-auto" append-icon="eye-slash"
						      @click="toggleHideTimePeriod(group.timePeriod.id as number)">{{ $t('general.hide') }}
						</VBtn>
					</VCol>
				</VRow>
				<ToDoList
					v-if="group.items.length > 0"
					:kind="ToDoListKind.ROUTINE"
					:items="group.items"
					:color="group.timePeriod.color"
					@itemsChanged="itemsChanged"
					@editItem="toDoListDialog?.openEdit"
					@deletedItem="onDelete"
				></ToDoList>
			</VCard>
		</VCol>
	</VRow>
	<VRow justify="center" class="mt-lg-5 mt-md-3">
		<VCol class="d-flex justify-center">
			<VCard class="d-flex align-center pa-2 ga-2" color="blue-grey-lighten-1">
				<h2>Hidden items</h2>
				<VCard class="d-flex pa-2" v-for="group in groupedItems.filter(item=>item.timePeriod.isHiddenInView===true)">
					<h3 class="pr-2">
						{{ group.timePeriod.text }}
					</h3>
					<VBtn color="secondary" density="comfortable" class="my-auto ml-auto" append-icon="eye"
					      @click="toggleHideTimePeriod(group.timePeriod.id as number)">{{ $t('general.show') }}
					</VBtn>
				</VCard>
			</VCard>
		</VCol>
	</VRow>
</div>
<RoutineToDoListDialog ref="toDoListDialog" @add="add" @edit="edit" @quickEditedActivity="quickEditedActivity"></RoutineToDoListDialog>
</template>
<script setup lang="ts">
import RoutineToDoListDialog from '../components/dialogs/toDoList/RoutineToDoListDialog.vue';
import ToDoList from '../components/toDoList/ToDoList.vue';
import {ref, onMounted, computed} from 'vue';
import {RoutineTodoListItemEntity, RoutineTodoListGroupedList, RoutineTodoListItemRequest, ToDoListKind, ToDoListItemRequest} from '@/classes/ToDoListItem';
import type {RoutineToDoListItemDialogType} from '@/classes/types/RefTypeInterfaces';
import {useActivityCrud, useRoutineTodoListItemCrud} from '@/composables/ConcretesCrudComposable.ts';

const {fetchById: fetchActivityById} = useActivityCrud()
const {fetchById, createWithResponse, updateWithResponse, deleteEntity, changeTimePeriodVisibility, getAllGrouped} = useRoutineTodoListItemCrud()

const groupedItems = ref([] as RoutineTodoListGroupedList[]);
const toDoListDialog = ref<RoutineToDoListItemDialogType>({} as RoutineToDoListItemDialogType);

onMounted(() => {
	getAllRecords();
});
const shownGroups = computed(() => groupedItems.value.filter(item => item.timePeriod.isHiddenInView === false))

function getAllRecords() {
	getAllGrouped().then((response) => {
		groupedItems.value = response;
	});
}

async function toggleHideTimePeriod(id: number) {
	const group = groupedItems.value.find(item => item.timePeriod.id === id);
	if (group) {
		group.timePeriod.isHiddenInView = !group.timePeriod.isHiddenInView;
	}
	await changeTimePeriodVisibility(id)
}

async function add(request: RoutineTodoListItemRequest) {
	const response = await createWithResponse(request);

	const updatedList = groupedItems.value.find((group) => group.timePeriod.id === response.timePeriod.id)?.items;
	if (updatedList) {
		updatedList.push(response);
		updatedList.sort((a, b) => a.id - b.id);
	} else {
		console.error('not found group');
	}
}

async function quickEditedActivity(id: number) {
	for (const group of groupedItems.value) {
		const item = group.items.find(item => item.activity.id === id);
		if (item) {
			item.activity = await fetchActivityById(id);
		}
	}
}

async function edit(beforeEditEntity: RoutineTodoListItemEntity, toDoListItemRequest: RoutineTodoListItemRequest) {
	if (beforeEditEntity && (beforeEditEntity.timePeriod.id !== toDoListItemRequest.timePeriodId || beforeEditEntity.activity?.id !== toDoListItemRequest.activityId)) {
		const updatedItem = await updateWithResponse(beforeEditEntity.id, toDoListItemRequest)

		const oldGroup = groupedItems.value.find((group) => {
			return group.items.some((item) => item.id === beforeEditEntity.id);
		});
		const updatedList = groupedItems.value.find((group) => group.timePeriod.id === updatedItem.timePeriod.id)?.items;
		if (oldGroup) {
			if (updatedList) {
				if (updatedItem.timePeriod.id === oldGroup?.timePeriod.id) {
					updatedList[updatedList.findIndex((item) => item.id === updatedItem.id)] = updatedItem;
				} else {
					oldGroup.items = oldGroup?.items.filter((item) => item.id !== updatedItem.id);
					updatedList.push(updatedItem);
				}
			} else {
				console.error('not found updated group list');
			}
		} else {
			console.error('not found old group');
		}
	}
};

function onDelete(id: number) {
	deleteEntity(id).then((deletedItem) => {
		const group = groupedItems.value.find((group) => group.items.some((item) => item.id === id));
		if (group) {
			group.items = group.items.filter((item) => item.id !== id);
		}
	})
}

const itemsChanged = (changedItems: RoutineTodoListItemEntity[]) => {
	console.log(changedItems);
	groupedItems.value = groupedItems.value.map((group) => ({
		...group,
		items: group.items.filter((item) => changedItems.some((changedItem) => changedItem.id === item.id)),
	}));
};
</script>
