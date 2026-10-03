import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
import { useActivityHistoryCrud } from '@/core/activityHistory/api/activityHistoryApi.ts'

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

	function pushBulkRescheduleUndo(count: number, onRestoreDueDates: () => Promise<void>) {
		push({ description: `Reschedule (${count})`, undo: onRestoreDueDates })
	}

	/**
	 * `historyRecordIds`: every row the log wrote — a timer session is several. One by one, not in
	 * parallel: the API drops the session with its last row, and that probe must see the others gone.
	 */
	function pushLogTimeUndo(activityName: string, historyRecordIds: number[], onItemUncheck?: () => Promise<void>) {
		push({
			description: `Log time "${activityName}"`,
			undo: async () => {
				for (const id of historyRecordIds) await deleteHistoryRecord(id)
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
		pushBulkRescheduleUndo,
		pushLogTimeUndo,
	}
}
