<template>
<div class="h-100 w-100 d-flex flex-column">
	<VRow justify="center" class="mt-lg-5 mt-md-3 position-sticky">
		<VCol cols="12" sm="10" md="4" lg="3" class="d-flex justify-center ga-2">
			<VBtn to="/routine-settings" prependIcon="gear">Nastavenia</VBtn>
			<VBtn class="flex-grow-1" color="primary" prependIcon="plus" @click="toDoListDialog?.openCreate()" :disabled="isInChangeOrderMode">
				{{ $t('toDoList.add') }}
			</VBtn>
			<VBtn
				:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
				:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
				@click="toggleChangeOrderMode"
				append-icon="arrows-up-down"
			>Reorder items
			</VBtn>
		</VCol>
	</VRow>
	<VRow class="flex-grow-1 h-100 overflow-y-auto" justify="center">
		<VCol class="px-2 h-auto" :md="shownGroups.length % 2 == 0 ? 6 : undefined" :lg="shownGroups.length > 2 ? 3 : undefined"
		      v-for="group in shownGroups" :key="group.timePeriod.id">
			<VCard class="mx-auto rounded-lg px-4 py-5 d-flex flex-column ga-4" min-width="350">
				<VSheet class="mx-auto px-3 d-flex align-center ga-3" rounded :color="getBgColor(group.timePeriod.color)">
					<VCardTitle class="px-0">{{ group.timePeriod.text }}</VCardTitle>
					<span class="text-caption opacity-60 ml-1">{{ group.timePeriod.lengthInDays }}d</span>
					<VTooltip v-if="group.timePeriod.streak > 0" location="top">
						<template v-slot:activator="{ props: tooltipProps }">
							<div v-bind="tooltipProps" class="d-flex align-center ga-1 text-white">
								<VIcon icon="fire-flame-curved" size="16" :color="group.timePeriod.streak >= group.timePeriod.bestStreak ? 'warning' : 'white'"></VIcon>
								<span class="text-body-2 font-weight-bold">{{ group.timePeriod.streak }}</span>
							</div>
						</template>
						<span>Group streak: {{ group.timePeriod.streak }} | Best: {{ group.timePeriod.bestStreak }}</span>
					</VTooltip>
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
					:activityIds="group.items.map(item => item.activity.id)"
					:streakConfig="{ graceDays: group.timePeriod.streakGraceDays, periodLengthInDays: group.timePeriod.lengthInDays }"
				@itemsChanged="onItemsChanged"
					@editItem="toDoListDialog?.openEdit"
					@deletedItem="onDelete"
					@itemsReordered="(oldIndex, newIndex, request) => handleOrderChange(oldIndex, newIndex, request, group.timePeriod.id as number)"
					@crossListDrop="handleCrossListDrop"
				></ToDoList>
				<VProgressLinear
					:modelValue="groupProgress(group.items).done"
					:max="groupProgress(group.items).total"
					rounded="sm"
					height="10"
					color="secondary-accent"
				>
				</VProgressLinear>
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
import {computed, onMounted, ref} from 'vue';
import {RoutineTodoListItemEntity} from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts';
import {RoutineTodoListGroupedList} from '@/dtos/response/todoList/RoutineTodoListGroupedList.ts';
import {RoutineTodoListItemRequest} from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts';
import {ToDoListKind} from '@/dtos/enum/ToDoListKind';
import {ChangeDisplayOrderRequest} from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts';
import {useRoutineTimePeriodCrud} from '@/api/routineTodoList/timePeriodApi.ts';
import {useRoutineTodoListItemCrud} from '@/api/routineTodoList/routineTodoListApi.ts';
import {hasObjectChanged} from '@/utils/helperMethods.ts';
import {useColor} from '@/utils/colorPalette.ts';

const {getBgColor} = useColor();
const {changeTimePeriodVisibility} = useRoutineTimePeriodCrud()
const {fetchById, createWithResponse, update, deleteEntity, getAllGrouped, changeDisplayOrder} = useRoutineTodoListItemCrud()

const groupedItems = ref([] as RoutineTodoListGroupedList[]);
const toDoListDialog = ref<InstanceType<typeof RoutineToDoListDialog>>();
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
		const [movedItem] = group.items.splice(oldIndex, 1);
		if (movedItem) {
			group.items.splice(newIndex, 0, movedItem);
		}
		await changeDisplayOrder(request);
	}
}

async function handleCrossListDrop(sourceListId: number, targetListId: number, itemId: number, dropTarget: any) {
	const sourceGroup = groupedItems.value.find(g => g.timePeriod.id === sourceListId);
	const targetGroup = groupedItems.value.find(g => g.timePeriod.id === targetListId);

	if (!sourceGroup || !targetGroup) return;

	const sourceIndex = sourceGroup.items.findIndex(item => item.id === itemId);
	const movedItem = sourceGroup.items[sourceIndex];

	if (!movedItem) return;

	sourceGroup.items.splice(sourceIndex, 1);

	let targetIndex = 0;
	if (dropTarget.data.type === 'drop-zone') {
		targetIndex = dropTarget.data.index;
		if (dropTarget.data.position === 'bottom') {
			targetIndex += 1;
		}
	}
	targetGroup.items.splice(targetIndex, 0, movedItem);

	const updateRequest = new RoutineTodoListItemRequest(
		movedItem.activity.id,
		targetListId,
		movedItem.doneCount,
		movedItem.totalCount,
		movedItem.isDone
	);

	await update(itemId, updateRequest);

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

function groupProgress(items: RoutineTodoListItemEntity[]) {
	const done = items.reduce((sum, item) => sum + (item.doneCount ?? (item.isDone ? 1 : 0)), 0);
	const total = items.reduce((sum, item) => sum + (item.totalCount ?? 1), 0);
	return {done, total};
}

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
	deleteEntity(id).then(() => {
		const group = groupedItems.value.find((group) => group.items.some((item) => item.id === id));
		if (group) {
			group.items = group.items.filter((item) => item.id !== id);
		}
	})
}

function onItemsChanged(changedItems: number[]) {
	groupedItems.value = groupedItems.value.map((group) => ({
		...group,
		items: group.items.filter((item) => changedItems.includes(item.id)),
	}));
}
</script>
