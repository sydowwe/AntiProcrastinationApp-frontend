<template>
<div
	class="todo-list"
	:class="{ 'list-invalid-drop-target': isDraggingDuplicateActivity }"
	ref="autoParent"
>
	<SubtleCard class="duplicate-warning-banner" v-if="isDraggingDuplicateActivity" color="error" icon="ban" title="Task already present in this list" titleCentered>

	</SubtleCard>

	<div
		v-for="(item, index) in items"
		:key="`${item.id}`"
		class="todo-item-container"
		:data-index="index"
	>
		<!-- Drop zone above item (invisible overlay) - only when dragging -->
		<div
			v-if="isInChangeOrderMode && isDragging && index === 0"
			:ref="el => setDropZoneRef(el as HTMLElement, index, 'top')"
			class="drop-zone-overlay drop-zone-overlay--top"
		/>

		<TodoListItemDragAndDropPlaceholder v-if="isInChangeOrderMode && dropIndicators[`0-top`] && index === 0" is-first></TodoListItemDragAndDropPlaceholder>
		<TodoListItemDragAndDropPlaceholder v-if="isInChangeOrderMode && invalidDropIndicators[`0-top`] && index === 0" is-first
		                                    is-invalid></TodoListItemDragAndDropPlaceholder>

		<ToDoListItem
			:toDoListItem="item"
			:color="(item as any).taskPriority?.color ?? 'primary'"
			:isInChangeOrderMode="isInChangeOrderMode"
			:listId="listId"
			:isDragging="dragState.draggedIndex === index"
			@delete="deleteItem"
			@edit="(entityToEdit: TEntity) => editItem(entityToEdit as TEntity)"
			@select="select"
			@un-select="unSelect"
			@isDoneChanged="handleIsDoneChanged"
		/>

		<!-- Drop zone below item (invisible overlay) - only when dragging -->
		<div
			v-if="isInChangeOrderMode && isDragging"
			:ref="el => setDropZoneRef(el as HTMLElement, index, 'bottom')"
			class="drop-zone-overlay"
			:class="{ 'drop-zone-overlay--bottom': index === items.length -1 }"
		/>

		<TodoListItemDragAndDropPlaceholder v-if="isInChangeOrderMode && dropIndicators[`${index}-bottom`]"></TodoListItemDragAndDropPlaceholder>
		<TodoListItemDragAndDropPlaceholder v-if="isInChangeOrderMode && invalidDropIndicators[`${index}-bottom`]" is-invalid></TodoListItemDragAndDropPlaceholder>
	</div>

	<!-- Empty state drop zone when list is empty -->
	<TodoListEmptyDropZone
		v-if="items.length === 0 && isInChangeOrderMode"
		ref="emptyDropZoneRef"
		:isDraggedOver="dragState.isEmptyZoneDraggedOver"
		:isInvalidDrop="dragState.isEmptyZoneInvalidDrop"
	/>
</div>

<ToDoListItemDoneDialog
	v-model="itemDoneDialogShown"
	:toDoListItem="currentDoneItem"
	:isRecursive="isDialogRecursive"
	@openNext="recursiveDialogsToSaveToHistory"
/>
</template>

<script setup lang="ts" generic="TEntity extends IBaseToDoListItem">
import ToDoListItem from './ToDoListItem.vue';
import ToDoListItemDoneDialog from '@/components/dialogs/toDoList/ToDoListItemDoneDialog.vue';
import {ChangeDisplayOrderRequest} from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts';
import {ToDoListKind} from '@/dtos/enum/ToDoListKind.ts';
import {onMounted, ref, toRef} from 'vue';
import {API} from '@/plugins/axiosConfig.ts';
import TodoListItemDragAndDropPlaceholder from '@/components/toDoList/dragAndDrop/TodoListItemDragAndDropPlaceholder.vue';
import TodoListEmptyDropZone from '@/components/toDoList/dragAndDrop/TodoListEmptyDropZone.vue';
import {useTodoListDragAndDrop} from '@/composables/useTodoListDragAndDrop.ts';
import {useAutoAnimate} from '@formkit/auto-animate/vue';
import SubtleCard from '@/components/general/feedback/SubtleCard.vue';
import type {IBaseToDoListItem} from '@/dtos/response/interface/IBaseToDoListItem.ts';

// Auto-animate controller
const [autoParent] = useAutoAnimate({duration: 300, easing: 'ease-in-out'});

const props = defineProps({
	kind: {
		type: Number,
		default: ToDoListKind.NORMAL,
	},
	items: {
		type: Array as () => TEntity[],
		required: true,
	},
	isInChangeOrderMode: {
		type: Boolean,
		required: true,
	},
	listId: {
		type: Number,
		required: true,
	},
	activityIds: {
		type: Array as () => number[],
		required: true,
	}
});

// Drag and drop state - declare ref before using in composable
const emptyDropZoneRef = ref<any>(null);

function handleSameListDrop(sourceIndex: number, targetIndex: number, itemId: number, dropType: 'drop-zone' | 'empty-zone', position?: 'top' | 'bottom') {
	if (dropType === 'drop-zone' && position) {
		let finalIndex = targetIndex;

		if (position === 'bottom') {
			finalIndex = targetIndex + 1;
		}

		// Adjust for moving within the same list
		if (sourceIndex < finalIndex) {
			finalIndex -= 1;
		}

		if (sourceIndex !== finalIndex && sourceIndex >= 0 && finalIndex >= 0 && finalIndex <= props.items.length) {
			const precedingItem = finalIndex > 0 ? props.items[finalIndex] : null;
			const followingItem = finalIndex < props.items.length ? props.items[finalIndex + 1] : null;

			const request = new ChangeDisplayOrderRequest(
				itemId,
				precedingItem?.id ?? null,
				followingItem?.id ?? null
			);

			emit('itemsReordered', sourceIndex, finalIndex, request);
		}
	} else if (dropType === 'empty-zone') {
		const followingItem = props.items.length > 1 ? props.items[0] : null;

		const request = new ChangeDisplayOrderRequest(
			itemId,
			null,
			followingItem?.id ?? null
		);

		emit('itemsReordered', sourceIndex, 0, request);
	}
}

function handleCrossListDrop(sourceListId: number, targetListId: number, itemId: number, dropTarget: any) {
	emit('crossListDrop', sourceListId, targetListId, itemId, dropTarget);
}

const {
	isDragging,
	isDraggingDuplicateActivity,
	dragState,
	dropIndicators,
	invalidDropIndicators,
	setDropZoneRef,
	setupDragAndDrop,
} = useTodoListDragAndDrop({
	items: toRef(props, 'items'),
	listId: toRef(props, 'listId'),
	activityIds: toRef(props, 'activityIds'),
	isInChangeOrderMode: toRef(props, 'isInChangeOrderMode'),
	emptyDropZoneRef,
	onSameListDrop: handleSameListDrop,
	onCrossListDrop: handleCrossListDrop,
});

// Setup drag and drop monitoring
onMounted(() => {
	setupDragAndDrop();
});

// Other methods not drag and drop
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

const handleIsDoneChanged = (toDoListItem: TEntity) => {
	const isBatchAction = selectedItemsIds.value.length > 1 && selectedItemsIds.value.includes(toDoListItem.id);
	if (toDoListItem.isDone) {
		if (isBatchAction) {
			changedItems.value = props.items.filter((item: TEntity) => selectedItemsIds.value.includes(item.id));
			recursiveDialogsToSaveToHistory();
		} else {
			currentDoneItem.value = toDoListItem;
			isDialogRecursive.value = false;
			itemDoneDialogShown.value = true;
		}
	}
	const request = {ids: isBatchAction ? selectedItemsIds : [toDoListItem.id]};
	API.patch(`/${url}/toggle-is-done`, request)
		.then(() => {
			if (isBatchAction) {
				emit('itemsChanged', selectedItemsIds.value);
				selectedItemsIds.value = [];
			} else {
				emit('itemsChanged', [toDoListItem.id]);
			}
		})
		.catch((error) => {
			console.error(error);
		});
};

const deleteItem = (id: number) => {
	if (selectedItemsIds.value.length > 1) {
		const batchDeleteIds = selectedItemsIds.value.map((id: number) => id);
		emit('batchDeletedItems', batchDeleteIds);
	} else {
		emit('deletedItem', id);
	}
};

const select = (id: number) => {
	if (!selectedItemsIds.value.includes(id)) {
		selectedItemsIds.value.push(id);
	}
};

const unSelect = (id: number) => {
	selectedItemsIds.value = selectedItemsIds.value.filter((item) => item != id);
};


const emit = defineEmits<{
	(e: 'itemsChanged', changedItems: number[]): void;
	(e: 'editItem', entityToEdit: TEntity): void;
	(e: 'deletedItem', id: number): void;
	(e: 'batchDeletedItems', ids: number[]): void;
	(e: 'itemsReordered', oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest): void;
	(e: 'crossListDrop', sourceListId: number, targetListId: number, itemId: number, dropTarget: any): void;
}>();
</script>

<style scoped>
.todo-list {
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 24px 0;
	min-height: 200px;
	position: relative;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.todo-list.list-invalid-drop-target {
	opacity: 0.6;
	pointer-events: none;
}

.duplicate-warning-banner {
	animation: slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 1001;
}

@keyframes slideInDown {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.todo-item-container {
	position: relative;
}

.drop-zone-overlay {
	position: absolute;
	left: 0;
	right: 0;
	z-index: 1000;
	background: transparent;
	pointer-events: auto;
}

@keyframes fadeInScale {
	0% {
		opacity: 0;
		transform: scale(0.95);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}
</style>
