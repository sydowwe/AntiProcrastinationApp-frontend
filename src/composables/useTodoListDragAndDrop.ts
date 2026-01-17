import {computed, nextTick, onBeforeUnmount, reactive, ref, type Ref, watch} from 'vue';
import {dropTargetForElements, monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {useDragAndDropMonitor} from '@/composables/UseDragAndDropMonitor.ts';
import type {IBaseToDoListItem} from '@/dtos/response/interface/IBaseToDoListItem.ts';

interface UseTodoListDragAndDropOptions<TEntity extends IBaseToDoListItem> {
	items: Ref<TEntity[]>;
	listId: Ref<number>;
	activityIds: Ref<number[]>;
	isInChangeOrderMode: Ref<boolean>;
	emptyDropZoneRef: Ref<any>;
	onSameListDrop: (sourceIndex: number, targetIndex: number, itemId: number, dropType: 'drop-zone' | 'empty-zone', position?: 'top' | 'bottom') => void;
	onCrossListDrop: (sourceListId: number, targetListId: number, itemId: number, dropTarget: any) => void;
}

export function useTodoListDragAndDrop<TEntity extends IBaseToDoListItem>(
	options: UseTodoListDragAndDropOptions<TEntity>
) {
	const {items, listId, activityIds, isInChangeOrderMode, emptyDropZoneRef, onSameListDrop, onCrossListDrop} = options;

	const {setupGlobalMonitor, globalIsDragging, globalDraggedActivityId, globalDraggedSourceListId} = useDragAndDropMonitor();

	const isDragging = computed(() => globalIsDragging.value);

	const isDraggingDuplicateActivity = computed(() => {
		if (!globalIsDragging.value || !globalDraggedActivityId.value) return false;
		// Don't show warning if dragging within the same list
		if (globalDraggedSourceListId.value === listId.value) return false;
		// Show warning if this list already contains the dragged activity
		return activityIds.value.includes(globalDraggedActivityId.value);
	});

	const dragState = reactive({
		draggedIndex: null as number | null,
		isDraggedOver: false,
		isEmptyZoneDraggedOver: false,
		isEmptyZoneInvalidDrop: false,
	});

	const dropIndicators = ref<{ [key: string]: boolean }>({});
	const invalidDropIndicators = ref<{ [key: string]: boolean }>({});

	const dropZoneRefs = ref<{ [key: string]: HTMLElement }>({});
	const dropZoneCleanups = new Map<string, () => void>();

	let monitorCleanup: (() => void) | null = null;

	function setDropZoneRef(el: HTMLElement | null, index: number, position: 'top' | 'bottom') {
		if (el) {
			dropZoneRefs.value[`${index}-${position}`] = el;
		}
	}

	function setupDropZones() {
		Object.entries(dropZoneRefs.value).forEach(([key, element]) => {
			const [indexStr, position] = key.split('-');
			const index = parseInt(indexStr ?? '');

			if (element) {
				// Clean up existing registration for this drop zone if it exists
				const existingCleanup = dropZoneCleanups.get(key);
				if (existingCleanup) {
					existingCleanup();
					dropZoneCleanups.delete(key);
				}

				const cleanup = dropTargetForElements({
					element,
					canDrop: ({source}) => {
						if (source.data.type !== 'todo-item') return false;

						// Allow drops within the same list
						if (source.data.listId === listId.value) return true;

						// For cross-list drops, check if activity already exists
						const activityId = source.data.activityId as number;
						return !activityIds.value.includes(activityId);
					},
					getData: () => ({
						type: 'drop-zone',
						index,
						position,
						listId: listId.value
					}),
					onDragEnter: ({source}) => {
						const activityId = source.data.activityId as number;
						const isInvalid = source.data.listId !== listId.value && activityIds.value.includes(activityId);

						if (isInvalid) {
							invalidDropIndicators.value[key] = true;
						} else {
							dropIndicators.value[key] = true;
						}
					},
					onDragLeave: () => {
						dropIndicators.value[key] = false;
						invalidDropIndicators.value[key] = false;
					},
				});

				dropZoneCleanups.set(key, cleanup);
			}
		});
	}

	function setupEmptyZone() {
		// Clean up previous empty zone registration if it exists
		const existingCleanup = dropZoneCleanups.get('empty');
		if (existingCleanup) {
			existingCleanup();
			dropZoneCleanups.delete('empty');
		}

		const emptyZoneElement = emptyDropZoneRef.value?.rootRef?.$el;
		if (!emptyZoneElement) return;

		const cleanup = dropTargetForElements({
			element: emptyZoneElement,
			canDrop: ({source}) => {
				if (source.data.type !== 'todo-item') return false;

				// Allow drops within the same list
				if (source.data.listId === listId.value) return true;

				// For cross-list drops, check if activity already exists
				const activityId = source.data.activityId as number;
				return !activityIds.value.includes(activityId);
			},
			getData: () => ({
				type: 'empty-zone',
				listId: listId.value,
			}),
			onDragEnter: ({source}) => {
				const activityId = source.data.activityId as number;
				const isInvalid = source.data.listId !== listId.value && activityIds.value.includes(activityId);

				if (isInvalid) {
					dragState.isEmptyZoneInvalidDrop = true;
				} else {
					dragState.isEmptyZoneDraggedOver = true;
				}
			},
			onDragLeave: () => {
				dragState.isEmptyZoneDraggedOver = false;
				dragState.isEmptyZoneInvalidDrop = false;
			},
		});

		dropZoneCleanups.set('empty', cleanup);
	}

	function setupMonitor() {
		if (monitorCleanup) {
			monitorCleanup();
		}

		// Setup global monitor for cross-list drops
		setupGlobalMonitor((sourceListId, targetListId, itemId, dropTarget) => {
			onCrossListDrop(sourceListId, targetListId, itemId, dropTarget);
		});

		// Monitor drag operations for this specific list
		monitorCleanup = monitorForElements({
			onDragStart: ({source}: { source: any }) => {
				if (source.data.type === 'todo-item' && source.data.listId === listId.value) {
					const index = items.value.findIndex(item => item.id === source.data.itemId);
					dragState.draggedIndex = index;
					console.log('Set dragged index for list', listId.value, ':', index);
				}
			},
			onDrop: ({source, location}: { source: any; location: any }) => {
				// Only handle same-list drops here
				if (source.data.type === 'todo-item' && source.data.listId === listId.value) {
					const dropTarget = location.current.dropTargets.find((target: any) =>
						target.data.listId === listId.value &&
						(target.data.type === 'drop-zone' || target.data.type === 'empty-zone')
					);

					if (dropTarget) {
						const itemId = source.data.itemId as number;
						const sourceIndex = items.value.findIndex(item => item.id === itemId);

						if (dropTarget.data.type === 'drop-zone') {
							const targetIndex = dropTarget.data.index as number;
							const position = dropTarget.data.position as 'top' | 'bottom';
							onSameListDrop(sourceIndex, targetIndex, itemId, 'drop-zone', position);
						} else if (dropTarget.data.type === 'empty-zone') {
							onSameListDrop(sourceIndex, 0, itemId, 'empty-zone');
						}
					}
				}

				// Reset drag state for this list
				if (source.data.listId === listId.value) {
					dragState.draggedIndex = null;
				}
				dragState.isEmptyZoneDraggedOver = false;
				dragState.isEmptyZoneInvalidDrop = false;

				// Clear all drop indicators
				Object.keys(dropIndicators.value).forEach(key => {
					dropIndicators.value[key] = false;
				});
				Object.keys(invalidDropIndicators.value).forEach(key => {
					invalidDropIndicators.value[key] = false;
				});
			},
		});
	}

	function updateDropZonePositions() {
		if (!isDragging.value) return;

		Object.entries(dropZoneRefs.value).forEach(([key, element]) => {
			const [indexStr, position] = key.split('-');
			const index = parseInt(indexStr ?? '');

			if (!element) return;

			const container = element.closest('.todo-item-container');
			const item = container?.querySelector('.v-list-item:not(.empty-item-placeholder)');
			if (!item || !container) return;

			const itemRect = item.getBoundingClientRect();
			const itemHeight = itemRect.height;
			const heightExtension = dropIndicators.value[key] ? 50 : 0;

			const isFirst = index === 0;
			const isLast = index === items.value.length - 1;
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
		});
	}

	function setupDragAndDrop() {
		if (!isInChangeOrderMode.value) return;

		console.log('Setting up drag and drop for list:', listId.value);

		setupMonitor();
		setupDropZones();

		if (items.value.length === 0) {
			setupEmptyZone();
		}
	}

	function cleanup() {
		if (monitorCleanup) {
			monitorCleanup();
			monitorCleanup = null;
		}
		dropZoneCleanups.forEach(cleanup => cleanup());
		dropZoneCleanups.clear();
	}

	// Watch for mode changes
	watch(() => isInChangeOrderMode.value, async (newValue) => {
		cleanup();

		if (newValue) {
			await nextTick();
			setupDragAndDrop();
		}

		// Reset drag state
		dragState.draggedIndex = null;
		dragState.isDraggedOver = false;
		dragState.isEmptyZoneDraggedOver = false;
		dragState.isEmptyZoneInvalidDrop = false;

		// Clear drop indicators
		Object.keys(dropIndicators.value).forEach(key => {
			dropIndicators.value[key] = false;
		});
		Object.keys(invalidDropIndicators.value).forEach(key => {
			invalidDropIndicators.value[key] = false;
		});
	});

	// Watch for items length changes
	watch(() => items.value.length, async () => {
		if (isInChangeOrderMode.value) {
			await nextTick();
			setupDropZones();
			if (items.value.length === 0) {
				setupEmptyZone();
			}
		}
	});

	// Watch for global drag state
	watch(() => globalIsDragging.value, async (newValue) => {
		if (newValue && isInChangeOrderMode.value) {
			await nextTick();
			setupDropZones();
			if (items.value.length === 0) {
				setupEmptyZone();
			} else {
				updateDropZonePositions();
			}
		}
	});

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

	onBeforeUnmount(() => {
		cleanup();
	});

	return {
		isDragging,
		isDraggingDuplicateActivity,
		dragState,
		dropIndicators,
		invalidDropIndicators,
		setDropZoneRef,
		setupDragAndDrop,
	};
}
