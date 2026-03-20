<template>
<div class="h-100 w-100 d-flex flex-column">
	<div class="mx-auto w-100 w-md-33 d-flex flex-column ga-2 py-3 bg-background position-sticky px-3" style="top: 0; z-index: 1;">
		<div class="d-flex ga-2">
			<VBtn to="/routine-settings" prependIcon="gear" variant="tonal" color="secondaryOutline">Nastavenia</VBtn>
			<VSelect
				v-if="smAndDown"
				v-model="selectedGroupId"
				:items="groupSelectItems"
				label="Group"
				density="compact"
				hideDetails
			></VSelect>
			<VSelect
				v-else
				v-model="selectedGroupIds"
				:items="groupSelectItems"
				:label="`Groups (max ${maxVisible})`"
				multiple
				chips
				closableChips
				density="compact"
				hideDetails
				@update:modelValue="onGroupSelectUpdate"
			></VSelect>
		</div>
		<div class="d-flex ga-2">
			<VBtn class="flex-grow-1" color="primary" prependIcon="plus" @click="toDoListDialog?.openCreate()" :disabled="isInChangeOrderMode">
				{{ $t('toDoList.add') }}
			</VBtn>
			<VBtn
				:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
				:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
				@click="toggleChangeOrderMode"
				appendIcon="arrows-up-down"
			>Reorder
			</VBtn>
		</div>
	</div>
	<VRow class="flex-grow-1 overflow-hidden ma-0" style="min-height: 0;" justify="center">
		<VCol
			class="pa-2 h-100"
			cols="12"
			:sm="visibleGroups.length >= 2 ? 6 : undefined"
			:md="visibleGroups.length >= 3 ? 4 : undefined"
			:lg="visibleGroups.length >= 4 ? 3 : undefined"
			v-for="group in visibleGroups"
			:key="group.timePeriod.id"
		>
			<VCard class="h-100 rounded-lg px-3 px-md-4 py-4 d-flex flex-column ga-3">
				<VSheet class="mx-auto px-3 d-flex align-center ga-3" rounded :color="getBgColor(group.timePeriod.color)">
					<VCardTitle class="px-0">{{ group.timePeriod.text }}</VCardTitle>
					<span class="text-caption opacity-60 ml-1">{{ group.timePeriod.lengthInDays }}d</span>
					<VTooltip v-if="group.timePeriod.streak > 0" location="top">
						<template v-slot:activator="{ props: tooltipProps }">
							<div v-bind="tooltipProps" class="d-flex align-center ga-1 text-white">
								<VIcon icon="fire-flame-curved" size="16"
								       :color="group.timePeriod.streak >= group.timePeriod.bestStreak ? 'warning' : 'white'"></VIcon>
								<span class="text-body-2 font-weight-bold">{{ group.timePeriod.streak }}</span>
							</div>
						</template>
						<span>Group streak: {{ group.timePeriod.streak }} | Best: {{ group.timePeriod.bestStreak }}</span>
					</VTooltip>
				</VSheet>

				<div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
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
				</div>
				<VProgressLinear
					:modelValue="groupProgress(group.items).done"
					:max="groupProgress(group.items).total"
					rounded="sm"
					height="17"
					color="secondary-accent"
				>
    					<span class="position-absolute w-100 text-center text-caption font-weight-bold text-white">
    						{{
							    groupProgress(group.items).total
								    ? Math.round((groupProgress(group.items).done / groupProgress(group.items).total) * 100)
								    : 0
						    }}%
    					</span>
				</VProgressLinear>
			</VCard>
		</VCol>
	</VRow>
</div>
<RoutineToDoListDialog ref="toDoListDialog" @add="add" @edit="edit"></RoutineToDoListDialog>
</template>
<script setup lang="ts">
import RoutineToDoListDialog from '../components/dialogs/toDoList/RoutineToDoListDialog.vue';
import ToDoList from '../components/toDoList/ToDoList.vue';
import {computed, onMounted, ref, watch} from 'vue';
import {useDisplay} from 'vuetify';
import {RoutineTodoListItemEntity} from '@/dtos/response/todoList/RoutineTodoListItemEntity.ts';
import {RoutineTodoListGroupedList} from '@/dtos/response/todoList/RoutineTodoListGroupedList.ts';
import {RoutineTodoListItemRequest} from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts';
import {ToDoListKind} from '@/dtos/enum/ToDoListKind';
import {ChangeDisplayOrderRequest} from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts';
import {useRoutineTodoListItemCrud} from '@/api/routineTodoList/routineTodoListApi.ts';
import {hasObjectChanged} from '@/utils/helperMethods.ts';
import {useColor} from '@/utils/colorPalette.ts';

const {getBgColor} = useColor();
const {fetchById, createWithResponse, update, deleteEntity, getAllGrouped, changeDisplayOrder} = useRoutineTodoListItemCrud()

const {smAndDown, mdAndDown} = useDisplay()

const groupedItems = ref([] as RoutineTodoListGroupedList[]);
const toDoListDialog = ref<InstanceType<typeof RoutineToDoListDialog>>();
const isInChangeOrderMode = ref(false);
const selectedGroupIds = ref<number[]>([]);

const selectedGroupId = computed<number | null>({
	get: () => selectedGroupIds.value[0] ?? null,
	set: (id) => {
		selectedGroupIds.value = id != null ? [id] : []
	}
})

const maxVisible = computed(() => {
	if (smAndDown.value) return 1;
	if (mdAndDown.value) return 2;
	return 4;
})

const shownGroups = computed(() => groupedItems.value.filter(item => !item.timePeriod.isHidden))

const groupSelectItems = computed(() =>
	shownGroups.value.map(g => ({title: g.timePeriod.text, value: g.timePeriod.id as number}))
)

const visibleGroups = computed(() =>
	shownGroups.value.filter(g => selectedGroupIds.value.includes(g.timePeriod.id as number))
)

watch(shownGroups, (groups) => {
	if (selectedGroupIds.value.length === 0 && groups.length > 0) {
		selectedGroupIds.value = groups.slice(0, maxVisible.value).map(g => g.timePeriod.id as number);
	}
}, {immediate: true})

watch(maxVisible, (max) => {
	if (selectedGroupIds.value.length > max) {
		selectedGroupIds.value = selectedGroupIds.value.slice(0, max);
	}
})

function onGroupSelectUpdate(ids: number[]) {
	if (ids.length <= maxVisible.value) {
		selectedGroupIds.value = ids;
	}
}

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
