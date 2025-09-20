<template>
<div
	ref="listRef"
	class="todo-list"
>
	<div
		v-for="(item, index) in items"
		:key="`${item.id}-${index}`"
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

		<ToDoListItem
			:ref="el => setItemRef(el, index)"
			:toDoListItem="item"
			:color="(item as any).taskUrgency?.color ?? 'primary'"
			:isInChangeOrderMode="isInChangeOrderMode"
			:listId="listId"
			:isDragging="dragState.draggedIndex === index"
			@delete="deleteItem"
			@edit="(entityToEdit: BaseToDoListItemEntity) => editItem(entityToEdit as TEntity)"
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
	</div>

	<!-- Empty state drop zone when list is empty -->
	<VCard
		v-if="items.length === 0 && isInChangeOrderMode"
		ref="emptyDropZoneRef"
		class="empty-drop-zone"
		:class="{ 'is-drag-over': dragState.isEmptyZoneDraggedOver }"
		variant="outlined"
		color="primary"
	>
		<VCardText class="text-center">
			<VIcon icon="plus-circle-outline" size="48" color="primary" class="mb-2"/>
			<div class="text-primary font-weight-medium">Drop items here</div>
		</VCardText>
	</VCard>
</div>

<ToDoListItemDoneDialog
	v-model="itemDoneDialogShown"
	:toDoListItem="currentDoneItem"
	:isRecursive="isDialogRecursive"
	@openNext="recursiveDialogsToSaveToHistory"
/>
</template>

<script setup lang="ts" generic="TEntity extends BaseToDoListItemEntity">
// ... existing imports ...
import ToDoListItem from './ToDoListItem.vue';
import ToDoListItemDoneDialog from '@/components/dialogs/toDoList/ToDoListItemDoneDialog.vue';
import {type BaseToDoListItemEntity, ToDoListKind} from '@/classes/ToDoListItem';
import {ref, onMounted, onBeforeUnmount, watch, reactive, nextTick, computed} from 'vue';
import {API} from '@/plugins/axiosConfig.ts';
import {dropTargetForElements, monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import TodoListItemDragAndDropPlaceholder from '@/components/toDoList/TodoListItemDragAndDropPlaceholder.vue';

// ... existing props ...
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
	}
});

// Drag and drop state
const listRef = ref<HTMLElement | null>(null);
const emptyDropZoneRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLElement | null)[]>([]);
const dropZoneRefs = ref<{ [key: string]: HTMLElement }>({});

const isDragging = computed(() => dragState.draggedIndex !== null);
// const isDragging = true;

const dragState = reactive({
	draggedIndex: null as number | null,
	isDraggedOver: false,
	isEmptyZoneDraggedOver: false,
});

const dropIndicators = ref<{ [key: string]: boolean }>({});

let cleanupFunctions: (() => void)[] = [];

const setItemRef = (el: any, index: number) => {
	if (el && el.$el) {
		itemRefs.value[index] = el.$el as HTMLElement;
	} else if (el) {
		itemRefs.value[index] = el as HTMLElement;
	}
};

const setDropZoneRef = (el: HTMLElement | null, index: number, position: 'top' | 'bottom') => {
	if (el) {
		dropZoneRefs.value[`${index}-${position}`] = el;
	}
};

// Setup drag and drop monitoring
onMounted(() => {
	nextTick(() => {
		setupDragAndDrop();
	});
});

onBeforeUnmount(() => {
	cleanupFunctions.forEach(cleanup => cleanup());
});

watch(() => props.isInChangeOrderMode, async (newValue) => {
	// Clean up previous setup
	cleanupFunctions.forEach(cleanup => cleanup());
	cleanupFunctions = [];

	if (newValue) {
		await nextTick();
		setupDragAndDrop();
	}

	// Reset drag state
	dragState.draggedIndex = null;
	dragState.isDraggedOver = false;
	dragState.isEmptyZoneDraggedOver = false;

	// Clear drop indicators
	Object.keys(dropIndicators.value).forEach(key => {
		dropIndicators.value[key] = false;
	});
});

watch(() => props.items.length, async () => {
	if (props.isInChangeOrderMode) {
		await nextTick();
		setupDropZones();
		if (props.items.length === 0) {
			setupEmptyZone();
		}
	}
});

const setupDragAndDrop = () => {
	if (!props.isInChangeOrderMode) return;

	console.log('Setting up drag and drop...');

	// Monitor drag operations globally
	const monitorCleanup = monitorForElements({
		onDragStart: ({source}: { source: any }) => {
			console.log('Drag start:', source.data);
			if (source.data.type === 'todo-item' && source.data.listId === props.listId) {
				const index = props.items.findIndex(item => item.id === source.data.itemId);
				dragState.draggedIndex = index;
				console.log('Set dragged index:', index);
			}
		},
		onDrop: ({source, location}: { source: any; location: any }) => {
			console.log('Drop:', source.data, location.current.dropTargets);
			dragState.draggedIndex = null;
			dragState.isEmptyZoneDraggedOver = false;

			// Clear all drop indicators with animation delay
			setTimeout(() => {
				Object.keys(dropIndicators.value).forEach(key => {
					dropIndicators.value[key] = false;
				});
			}, 150);

			if (source.data.type === 'todo-item' && source.data.listId === props.listId) {
				const itemId = source.data.itemId as number;
				const sourceIndex = props.items.findIndex(item => item.id === itemId);

				// Handle drop on drop zone
				const dropTarget = location.current.dropTargets.find((target: any) =>
					target.data.type === 'drop-zone'
				);

				if (dropTarget) {
					const targetIndex = dropTarget.data.index as number;
					const position = dropTarget.data.position as 'top' | 'bottom';

					let finalIndex = targetIndex;

					if (position === 'bottom') {
						finalIndex = targetIndex + 1;
					}

					// Adjust for moving within the same list
					if (sourceIndex < finalIndex) {
						finalIndex -= 1;
					}

					// Ensure we can move to any position, including above/below current position
					if (sourceIndex !== finalIndex && sourceIndex >= 0 && finalIndex >= 0 && finalIndex <= props.items.length) {
						console.log('Reordering:', sourceIndex, '->', finalIndex);
						emit('itemsReordered', sourceIndex, finalIndex);
					}
				}

				// Handle drop on empty zone
				const emptyZoneTarget = location.current.dropTargets.find((target: any) =>
					target.data.type === 'empty-zone'
				);

				if (emptyZoneTarget && sourceIndex >= 0) {
					emit('itemsReordered', sourceIndex, 0);
				}
			}
		},
	});

	cleanupFunctions.push(monitorCleanup);

	// Setup empty zone if needed
	if (props.items.length === 0) {
		setupEmptyZone();
	}
};

const setupDropZones = () => {
	Object.entries(dropZoneRefs.value).forEach(([key, element]) => {
		const [indexStr, position] = key.split('-');
		const index = parseInt(indexStr);

		if (element) {
			const cleanup = dropTargetForElements({
				element,
				canDrop: ({source}) => {
					const sourceIndex = props.items.findIndex(item => item.id === source.data.itemId);
					return position === 'top' ? sourceIndex !== index : sourceIndex !== index + 1;
				},
				getData: () => ({type: 'drop-zone', index, position}),
				onDragEnter: () => {
					dropIndicators.value[key] = true;
				},
				onDragLeave: () => {
					dropIndicators.value[key] = false;
				},
			});

			cleanupFunctions.push(cleanup);
		}
	});
};

const updateDropZonePositions = () => {
	if (!isDragging.value) return;

	Object.entries(dropZoneRefs.value).forEach(([key, element]) => {
			const [indexStr, position] = key.split('-');
			const index = parseInt(indexStr);

			if (!element) return;

			const container = element.closest('.todo-item-container');
			const item = container?.querySelector('.v-list-item:not(.empty-item-placeholder)');
			if (!item || !container) return;

			const itemRect = item.getBoundingClientRect();
			const itemHeight = itemRect.height;
			const heightExtension = dropIndicators.value[key] ? 50 : 0;

			const isFirst = index === 0;
			const isLast = index === props.items.length - 1;
			const isTop = position === 'top';

			const isEdgeZone = (isFirst && isTop) || isLast;
			const gapHeight = 20 + (isEdgeZone ? 4 : 0);

			const height = (isEdgeZone ? itemHeight / 2 : itemHeight) + gapHeight + heightExtension;
			element.style.height = `${height}px`;

			if (isFirst && isTop) {
				element.style.top = `-${gapHeight}px`;
			} else if (isFirst) {
				element.style.bottom = `-${itemHeight / 2 + gapHeight}px`;
			} else {
				element.style.top = `${itemHeight / 2}px`;
			}
		}
	)

}

// Watch for drop indicator changes and update positions
watch(() => dropIndicators.value, () => {
	nextTick(() => {
		updateDropZonePositions();
	});
}, {deep: true});

// Handle drag state changes
watch(() => dragState.draggedIndex, async (newValue, oldValue) => {
	if (newValue !== null && oldValue === null) {
		await nextTick();
		setupDropZones();
		updateDropZonePositions();
	} else if (newValue === null && oldValue !== null) {
		Object.keys(dropIndicators.value).forEach(key => {
			dropIndicators.value[key] = false;
		});
	}
});

const setupEmptyZone = () => {
	if (!emptyDropZoneRef.value) return;

	const cleanup = dropTargetForElements({
		element: emptyDropZoneRef.value,
		canDrop: ({source}) => source.data.type === 'todo-item',
		getData: () => ({
			type: 'empty-zone',
			listId: props.listId,
		}),
		onDragEnter: () => {
			dragState.isEmptyZoneDraggedOver = true;
		},
		onDragLeave: () => {
			dragState.isEmptyZoneDraggedOver = false;
		},
	});

	cleanupFunctions.push(cleanup);
};

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
	(e: 'editItem', entityToEdit: BaseToDoListItemEntity): void;
	(e: 'deletedItem', id: number): void;
	(e: 'batchDeletedItems', ids: number[]): void;
	(e: 'itemsReordered', oldIndex: number, newIndex: number): void;
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
	border: 1px solid mediumpurple;
}

.todo-item-container {
	position: relative;
}

/* Invisible drop zone overlays - now positioned dynamically via JavaScript */
.drop-zone-overlay {
	position: absolute;
	left: 0;
	right: 0;
	z-index: 1000;
	background: transparent;
	pointer-events: auto;
	border: 1px solid white;
	/* Remove static positioning - will be set by JavaScript */
}

.empty-drop-zone {
	min-height: 120px;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 2px dashed rgba(var(--v-theme-primary), 0.3) !important;
	background: rgba(var(--v-theme-primary), 0.02);
}

.empty-drop-zone.is-drag-over {
	background: rgba(var(--v-theme-primary), 0.08) !important;
	border-color: rgb(var(--v-theme-primary)) !important;
	transform: scale(1.01);
	box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.2),
	inset 0 0 24px rgba(var(--v-theme-primary), 0.1);
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
