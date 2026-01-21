import {onBeforeUnmount, readonly, ref} from 'vue';
import {monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

const globalIsDragging = ref(false);
const globalDraggedActivityId = ref<number | null>(null);
const globalDraggedSourceListId = ref<number | null>(null);

export function useDragAndDropMonitor() {
	let globalMonitorCleanup: (() => void) | null = null;

	const setupGlobalMonitor = (onCrossListDrop?: (sourceListId: number, targetListId: number, itemId: number, dropTarget: any) => void) => {
		if (globalMonitorCleanup) {
			globalMonitorCleanup();
		}

		globalMonitorCleanup = monitorForElements({
			onDragStart: ({source}) => {
				if (source.data.type === 'todo-item') {
					globalIsDragging.value = true;
					globalDraggedActivityId.value = source.data.activityId as number;
					globalDraggedSourceListId.value = source.data.listId as number;
					console.log('Global drag start:', source.data);
				}
			},
			onDrop: ({source, location}) => {
				if (source.data.type === 'todo-item') {
					globalIsDragging.value = false;
					globalDraggedActivityId.value = null;
					globalDraggedSourceListId.value = null;

					if (onCrossListDrop) {
						const sourceListId = source.data.listId as number;
						const itemId = source.data.itemId as number;

						const dropTarget = location.current.dropTargets.find((target: any) =>
							target.data.type === 'drop-zone' || target.data.type === 'empty-zone'
						);

						if (dropTarget) {
							const targetListId = dropTarget.data.listId as number || sourceListId;

							if (sourceListId !== targetListId) {
								onCrossListDrop(sourceListId, targetListId, itemId, dropTarget);
							}
						}
					}
				}
			},
		});
	};

	const cleanup = () => {
		if (globalMonitorCleanup) {
			globalMonitorCleanup();
			globalMonitorCleanup = null;
		}
		globalIsDragging.value = false;
		globalDraggedActivityId.value = null;
		globalDraggedSourceListId.value = null;
	};

	onBeforeUnmount(() => {
		cleanup();
	});

	return {
		setupGlobalMonitor,
		cleanup,
		globalIsDragging: readonly(globalIsDragging),
		globalDraggedActivityId: readonly(globalDraggedActivityId),
		globalDraggedSourceListId: readonly(globalDraggedSourceListId)
	};
}