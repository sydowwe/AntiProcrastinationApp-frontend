import {ref, onBeforeUnmount, readonly} from 'vue';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

const globalIsDragging = ref(false);

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
          console.log('Global drag start:', source.data);
        }
      },
      onDrop: ({source, location}) => {
        if (source.data.type === 'todo-item') {
          globalIsDragging.value = false;

          if (onCrossListDrop) {
            const sourceListId = source.data.listId;
            const itemId = source.data.itemId;

            const dropTarget = location.current.dropTargets.find((target: any) =>
                target.data.type === 'drop-zone' || target.data.type === 'empty-zone'
            );

            if (dropTarget) {
              const targetListId = dropTarget.data.listId || sourceListId;

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
  };

  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    setupGlobalMonitor,
    cleanup,
    globalIsDragging: readonly(globalIsDragging)
  };
}