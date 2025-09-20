<template>
<div class="h-100 w-100 d-flex flex-column">
	<VRow justify="center" class="mt-lg-5 mt-md-3 position-sticky">
		<VCol cols="12" sm="10" md="4" lg="3" class="d-flex justify-center ga-2">
			<VBtn class="flex-grow-1" color="primary" @click="toDoListDialog.openCreate()" :disabled="isInChangeOrderMode">{{ $t('toDoList.add') }}</VBtn>
			<VIconBtn
				:color="isInChangeOrderMode ? 'success' : 'secondary'" 
				:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
				@click="toggleChangeOrderMode"
				icon="check"
			></VIconBtn>
		</VCol>
	</VRow>
	<VRow class="flex-grow-1 h-100 overflow-y-auto" justify="center">
		<VCol class="px-2 h-auto" :md="shownGroups.length % 2 == 0 ? 6 : undefined" :lg="shownGroups.length > 2 ? 3 : undefined"
		      v-for="group in shownGroups" :key="group.timePeriod.id">
			<VCard class="mx-auto rounded-lg px-3 py-5 d-flex flex-column ga-4" min-width="350">
				<VSheet class="mx-auto px-3 d-flex align-center ga-3" rounded color="neutral-300">
					<VCardTitle class="px-0">{{ isInChangeOrderMode ? $t('toDoList.changeOrder') : group.timePeriod.text }}</VCardTitle>
					<VIconBtn color="white" variant="tonal" density="comfortable" class="ml-auto" icon="eye-slash"
					          @click="toggleHideTimePeriod(group.timePeriod.id as number)" :title="$t('general.hide')" :disabled="isInChangeOrderMode">
						<VIcon size="small"></VIcon>
					</VIconBtn>
				</VSheet>
				<ToDoList
					v-if="group.items.length > 0"
					:kind="ToDoListKind.ROUTINE"
					:items="group.items"
					:isInChangeOrderMode="isInChangeOrderMode"
					@itemsChanged="itemsChanged"
					@editItem="toDoListDialog?.openEdit"
					@deletedItem="onDelete"
					@orderChanged="(newOrder) => handleOrderChange(newOrder, group.timePeriod.id as number)"
				></ToDoList>
			</VCard>
		</VCol>
	</VRow>
	<VCard class="mx-auto d-flex align-center pa-2 ga-2" color="neutral-300" v-if="hiddenGroups.length > 0">
		<h2>Hidden list</h2>
		<VCard class="d-flex ga-2 pl-4 pa-2" v-for="group in hiddenGroups">
			<h3>
				{{ group.timePeriod.text }}
			</h3>
			<VBtn color="secondaryOutline" variant="tonal" density="comfortable" class="pl-2" append-icon="eye"
			      @click="toggleHideTimePeriod(group.timePeriod.id as number)">{{ $t('general.show') }}
			</VBtn>
		</VCard>
	</VCard>
</div>
<RoutineToDoListDialog ref="toDoListDialog" @add="add" @edit="edit"></RoutineToDoListDialog>
</template>
<script setup lang="ts">
import RoutineToDoListDialog from '../components/dialogs/toDoList/RoutineToDoListDialog.vue';
import ToDoList from '../components/toDoList/ToDoList.vue';
import {ref, onMounted, computed} from 'vue';
import {RoutineTodoListItemEntity, RoutineTodoListGroupedList, RoutineTodoListItemRequest, ToDoListKind, ToDoListItemRequest} from '@/classes/ToDoListItem';
import type {RoutineToDoListItemDialogType} from '@/classes/types/RefTypeInterfaces';
import {useActivityCrud, useRoutineTimePeriodCrud, useRoutineTodoListItemCrud} from '@/composables/ConcretesCrudComposable.ts';
import {hasObjectChanged} from '@/scripts/helperMethods.ts';

const {changeTimePeriodVisibility} = useRoutineTimePeriodCrud()
const {fetchById, createWithResponse, update, deleteEntity, getAllGrouped} = useRoutineTodoListItemCrud()

const groupedItems = ref([] as RoutineTodoListGroupedList[]);
const toDoListDialog = ref<RoutineToDoListItemDialogType>({} as RoutineToDoListItemDialogType);
const isInChangeOrderMode = ref(false);

onMounted(() => {
	getAllRecords();
});

function toggleChangeOrderMode() {
	isInChangeOrderMode.value = !isInChangeOrderMode.value;
}

async function handleOrderChange(newOrder: number[], timePeriodId: number) {
	const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId);
	if (group) {
		// Reorder the items array based on the new order
		const reorderedItems = newOrder.map(id => group.items.find(item => item.id === id)).filter(Boolean) as RoutineTodoListItemEntity[];
		group.items = reorderedItems;

		// Here you can add API call to save the new order to the backend if needed
		// Example: await saveGroupOrder(timePeriodId, newOrder);
	}
}
const shownGroups = computed(() => groupedItems.value.filter(item => !item.timePeriod.isHidden))
const hiddenGroups = computed(() => groupedItems.value.filter(item => item.timePeriod.isHidden))

function getAllRecords() {
	getAllGrouped().then((response) => {
		groupedItems.value = response;
	});
}

async function toggleHideTimePeriod(id: number) {
	const group = groupedItems.value.find(item => item.timePeriod.id === id);
	if (group) {
		group.timePeriod.isHidden = !group.timePeriod.isHidden;
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

async function edit(beforeEditEntity: RoutineTodoListItemEntity, toDoListItemRequest: RoutineTodoListItemRequest) {
	if (hasObjectChanged(RoutineTodoListItemRequest.fromEntity(beforeEditEntity), toDoListItemRequest)) {
		await update(beforeEditEntity.id, toDoListItemRequest)
	}

	const updatedItem = await fetchById(beforeEditEntity.id);
	const updatedList = groupedItems.value.find((group) => group.timePeriod.id === updatedItem.timePeriod.id)?.items;
	if (updatedList) {
		if (updatedItem.timePeriod.id === beforeEditEntity.timePeriod.id) {
			updatedList[updatedList.findIndex((item) => item.id === updatedItem.id)] = updatedItem;
		} else {
			const oldGroup = groupedItems.value.find((group) => group.timePeriod.id === beforeEditEntity.timePeriod.id);
			if (oldGroup) {
				oldGroup.items = oldGroup?.items.filter((item) => item.id !== updatedItem.id);
			}
			updatedList.push(updatedItem);
		}
	} else {
		console.error('not found updated group list');
	}
}

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
