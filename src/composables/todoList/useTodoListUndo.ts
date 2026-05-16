import { useUndoStack } from '@/composables/general/useUndoStack.ts'
import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'

export function useTodoListUndo() {
	const { push, undo, canUndo, stackSize, nextUndoDescription } = useUndoStack()
	const { deleteEntity: deleteHistoryRecord } = useActivityHistoryCrud()

	function pushDeleteUndo(itemName: string, onRestore: () => Promise<void>) {
		push({ description: `Delete "${itemName}"`, undo: onRestore })
	}

	function pushUncheckAllUndo(doneCount: number, onRecheck: () => Promise<void>) {
		push({ description: `Uncheck all (${doneCount})`, undo: onRecheck })
	}

	function pushReorderUndo(itemName: string, onReverseReorder: () => Promise<void>) {
		push({ description: `Reorder "${itemName}"`, undo: onReverseReorder })
	}

	function pushEditUndo(itemName: string, onRevert: () => Promise<void>) {
		push({ description: `Edit "${itemName}"`, undo: onRevert })
	}

	function pushLogTimeUndo(activityName: string, historyRecordId: number, onItemUncheck?: () => Promise<void>) {
		push({
			description: `Log time "${activityName}"`,
			undo: async () => {
				await deleteHistoryRecord(historyRecordId)
				if (onItemUncheck) await onItemUncheck()
			},
		})
	}

	return {
		undo,
		canUndo,
		stackSize,
		nextUndoDescription,
		pushDeleteUndo,
		pushUncheckAllUndo,
		pushReorderUndo,
		pushEditUndo,
		pushLogTimeUndo,
	}
}
