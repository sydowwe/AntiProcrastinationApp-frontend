import type { ComputedRef } from 'vue'
import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'

/**
 * The key map of a *focused* task block, as opposed to `usePlannerKeyboard`, which is bound to
 * `document` and acts on whatever is selected.
 *
 * Two rules shape it:
 *
 * 1. A block is exposed as `role="button"` + `aria-pressed` (see `BaseTaskBlock`), and the button
 *    pattern promises that Space *and* Enter activate the control. Activating a block means the
 *    same thing a click means — toggling its selection — so both keys do that and nothing else.
 *    `e` is the "open it" key, mirroring the double-click. Before this, Enter opened the edit dialog
 *    but only when exactly one task was already selected, which was unreachable without a mouse:
 *    nothing in the module could add a task to the selection from the keyboard at all.
 * 2. Edit and delete act on the focused block even when the selection is empty or points elsewhere.
 *    Otherwise the first keystroke after tabbing to a block silently does nothing, which reads as a
 *    dead widget.
 */
export function useTaskBlockKeyboard(
	store: AnyDayPlannerStore,
	taskId: () => number,
	isSelected: ComputedRef<boolean>,
) {
	/**
	 * The file-manager rule: acting on a block that is already part of the selection acts on the
	 * whole selection; acting on one outside it replaces the selection with that block. Anything
	 * else either silently no-ops or quietly widens a delete to tasks the user never pointed at.
	 */
	function selectFocusedIfOutsideSelection(): void {
		if (isSelected.value) return
		store.clearSelection()
		store.toggleTaskSelection(taskId())
	}

	function handleToggleSelectionKey(e: KeyboardEvent): void {
		e.preventDefault()
		store.toggleTaskSelection(taskId())
	}

	function handleEditKey(e: KeyboardEvent): void {
		e.preventDefault()
		// `openEditDialog` is a no-op unless exactly one task is selected, so narrow to the focused
		// block rather than leaving the keystroke to do nothing.
		if (!isSelected.value || store.selectedTaskIds.size !== 1) {
			store.clearSelection()
			store.toggleTaskSelection(taskId())
		}
		store.openEditDialog()
	}

	function handleDeleteKey(e: KeyboardEvent): void {
		e.preventDefault()
		selectFocusedIfOutsideSelection()
		store.openDeleteDialog()
	}

	/**
	 * Clears the selection but deliberately keeps focus on the block. The previous version blurred
	 * it, which handed focus to `<body>` and stranded a keyboard user at the top of the document —
	 * the same defect the action bars had on the way out.
	 */
	function handleEscapeKey(e: KeyboardEvent): void {
		e.preventDefault()
		store.clearSelection()
	}

	function handleDuplicateKey(): void {
		selectFocusedIfOutsideSelection()
		store.startDuplicate()
	}

	return { handleToggleSelectionKey, handleEditKey, handleDeleteKey, handleEscapeKey, handleDuplicateKey }
}
