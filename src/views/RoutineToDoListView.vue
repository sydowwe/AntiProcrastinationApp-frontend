<template>
<div class="h-100 w-100 d-flex flex-column">
	<VRow justify="center" class="mt-lg-5 mt-md-3 position-sticky">
		<VCol cols="12" sm="10" md="4" lg="3" class="d-flex justify-center ga-2">
			<VBtn class="flex-grow-1" color="primary" @click="toDoListDialog.openCreate()" :disabled="isInChangeOrderMode">{{ $t('toDoList.add') }}</VBtn>
			<VBtn
				text="drag & drop"
				:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
				:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
				@click="toggleChangeOrderMode"
				append-icon="arrows-up-down"
			></VBtn>
		</VCol>
	</VRow>
	<VRow class="flex-grow-1 h-100 overflow-y-auto" justify="center">
		<VCol class="px-2 h-auto" :md="shownGroups.length % 2 == 0 ? 6 : undefined" :lg="shownGroups.length > 2 ? 3 : undefined"
		      v-for="group in shownGroups" :key="group.timePeriod.id">
			<VCard class="mx-auto rounded-lg px-3 py-5 d-flex flex-column ga-4" min-width="350">
				<VSheet class="mx-auto px-3 d-flex align-center ga-3" rounded color="neutral-300">
					<VCardTitle class="px-0">{{ group.timePeriod.text }}</VCardTitle>
					<VIconBtn color="white" variant="tonal" density="comfortable" class="ml-auto" icon="eye-slash"
					          @click="toggleHideTimePeriod(group.timePeriod.id as number)" :title="$t('general.hide')" :disabled="isInChangeOrderMode">
						<VIcon size="small"></VIcon>
					</VIconBtn>
				</VSheet>
				<ToDoList
					:kind="ToDoListKind.ROUTINE"
					:items="group.items"
					:isInChangeOrderMode="isInChangeOrderMode"
					:listId="group.timePeriod.id as number"
					@itemsChanged="itemsChanged"
					@editItem="toDoListDialog?.openEdit"
					@deletedItem="onDelete"
					@itemsReordered="(oldIndex, newIndex, request) => handleOrderChange(oldIndex, newIndex, request, group.timePeriod.id as number)"
					@crossListDrop="handleCrossListDrop"
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
import {
	RoutineTodoListItemEntity,
	RoutineTodoListGroupedList,
	RoutineTodoListItemRequest,
	ToDoListKind,
	ToDoListItemRequest,
	ChangeDisplayOrderRequest
} from '@/classes/ToDoListItem';
import type {RoutineToDoListItemDialogType} from '@/classes/types/RefTypeInterfaces';
import {useActivityCrud, useRoutineTimePeriodCrud, useRoutineTodoListItemCrud} from '@/composables/ConcretesCrudComposable.ts';
import {hasObjectChanged} from '@/scripts/helperMethods.ts';

const {changeTimePeriodVisibility} = useRoutineTimePeriodCrud()
const {fetchById, createWithResponse, update, deleteEntity, getAllGrouped, changeDisplayOrder} = useRoutineTodoListItemCrud()

const groupedItems = ref([] as RoutineTodoListGroupedList[]);
const toDoListDialog = ref<RoutineToDoListItemDialogType>({} as RoutineToDoListItemDialogType);
const isInChangeOrderMode = ref(false);

onMounted(() => {
	getAllRecords();
});

function toggleChangeOrderMode() {
	isInChangeOrderMode.value = !isInChangeOrderMode.value;
}

async function handleOrderChange(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest, timePeriodId: number) {
	const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId);
	if (group) {
		// Perform the reorder immediately for UI responsiveness
		const [movedItem] = group.items.splice(oldIndex, 1);
		if (movedItem) {
			group.items.splice(newIndex, 0, movedItem);
		}

		console.log('Items reordered in group:', timePeriodId, {oldIndex, newIndex, newOrder: group.items.map(item => item.id)});

		// Call the API to persist the change
		await changeDisplayOrder(request);
	}
}

async function handleCrossListDrop(sourceListId: number, targetListId: number, itemId: number, dropTarget: any) {
	console.log('Cross-group drop:', {sourceListId, targetListId, itemId});

	const sourceGroup = groupedItems.value.find(g => g.timePeriod.id === sourceListId);
	const targetGroup = groupedItems.value.find(g => g.timePeriod.id === targetListId);

	if (!sourceGroup || !targetGroup) return;

	const sourceIndex = sourceGroup.items.findIndex(item => item.id === itemId);
	const movedItem = sourceGroup.items[sourceIndex];

	if (!movedItem) return;

	// Remove from source
	sourceGroup.items.splice(sourceIndex, 1);

	// Calculate target position
	let targetIndex = 0;
	if (dropTarget.data.type === 'drop-zone') {
		targetIndex = dropTarget.data.index;
		if (dropTarget.data.position === 'bottom') {
			targetIndex += 1;
		}
	}
	// Insert into target
	targetGroup.items.splice(targetIndex, 0, movedItem);

	// Update item's time period
	const updateRequest = new RoutineTodoListItemRequest(
		movedItem.activity.id,
		targetListId,
		movedItem.doneCount,
		movedItem.totalCount,
		movedItem.isDone
	);

	await update(itemId, updateRequest);

	// Handle ordering
	const precedingItem = targetIndex > 0 ? targetGroup.items[targetIndex - 1] : null;
	const followingItem = targetIndex < targetGroup.items.length - 1 ? targetGroup.items[targetIndex + 1] : null;

	const orderRequest = new ChangeDisplayOrderRequest(
		itemId,
		precedingItem?.id ?? null,
		followingItem?.id ?? null
	);

	await changeDisplayOrder(orderRequest);
}

const shownGroups = computed(() => groupedItems.value.filter(item => !item.timePeriod.isHidden))
const hiddenGroups = computed(() => groupedItems.value.filter(item => item.timePeriod.isHidden))

function getAllRecords() {
	getAllGrouped().then((response) => {
		groupedItems.value = response;
		console.log(groupedItems.value);
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
