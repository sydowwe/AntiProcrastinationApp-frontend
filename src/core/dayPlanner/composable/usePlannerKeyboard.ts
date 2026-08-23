import { onMounted, onUnmounted, type Ref } from 'vue'
import { type AnyPlannerTask, TaskSpan } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
import { usePlannerKeyboardScope } from '@/core/dayPlanner/composable/usePlannerKeyboardScope.ts'

export function usePlannerKeyboard(
	store: AnyDayPlannerStore,
	rootRef: Ref<HTMLElement | undefined>,
	removePreviewTasksFromGrid: () => void,
) {
	const undoStack = useUndoStack()
	// The listener stays on `document` — the grid is not focusable and hotkeys must work while the
	// pointer sits over the side panel — but it only acts for the planner the user is driving.
	const { isActive, hasOtherInstances } = usePlannerKeyboardScope(rootRef)

	let arrowDebounceTimer: ReturnType<typeof setTimeout> | null = null
	let arrowOriginals: AnyPlannerTask[] | null = null

	function handleKeyDown(e: KeyboardEvent): void {
		if (!isActive.value) return

		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

		if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault()
			undoStack.undo()
			return
		}

		if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && store.selectedTaskIds.size > 0) {
			e.preventDefault()
			const delta = e.key === 'ArrowUp' ? -1 : 1
			const selectedIds = store.selectedTaskIds
			const selectedTasks = store.tasks.filter(t => selectedIds.has(t.id) && !t.isBackground)
			if (selectedTasks.length === 0) return

			for (const task of selectedTasks) {
				const newStart = task.gridRowStart + delta
				const newEnd = task.gridRowEnd + delta
				if (newStart < 1 || newEnd > store.totalGridRows + 1) return
			}

			let hasConflict = false
			for (const task of selectedTasks) {
				const newStart = task.gridRowStart + delta
				const newEnd = task.gridRowEnd + delta
				if (
					store.tasks.some(t => {
						if (selectedIds.has(t.id) || t.isBackground) return false
						return !(newEnd <= t.gridRowStart || newStart >= t.gridRowEnd)
					})
				) {
					hasConflict = true
					break
				}
			}

			if (!arrowOriginals) arrowOriginals = selectedTasks.map(t => ({ ...t }))

			store.arrowMoveConflict = hasConflict
			for (const task of selectedTasks) {
				const newStart = task.gridRowStart + delta
				const newEnd = task.gridRowEnd + delta
				store.redrawTask(task.id, {
					startTime: store.slotIndexToTime(newStart - 1),
					endTime: store.slotIndexToTime(newEnd - 1),
					gridRowStart: newStart,
					gridRowEnd: newEnd,
				})
			}

			if (arrowDebounceTimer !== null) clearTimeout(arrowDebounceTimer)
			arrowDebounceTimer = setTimeout(() => {
				arrowDebounceTimer = null

				if (store.arrowMoveConflict) return

				const originals = arrowOriginals!
				arrowOriginals = null

				const moveDate = store.viewedDate ? new Date(store.viewedDate) : undefined
				const movedTasks = store.tasks.filter(t => originals.some(o => o.id === t.id))
				Promise.all(movedTasks.map(t => store.updateTaskSpan(t.id, TaskSpan.fromTask(t))))
					.then(() => {
						undoStack.push({
							description: movedTasks.length > 1 ? 'Tasks moved' : 'Task moved',
							date: moveDate,
							undo: async () => {
								for (const orig of originals) {
									store.redrawTask(orig.id, orig)
									await store.updateTaskSpan(orig.id, TaskSpan.fromTask(orig))
								}
							},
						})
					})
					.catch(() => {
						for (const orig of originals) store.redrawTask(orig.id, orig)
					})
			}, 400)
			return
		}

		if (e.key === 'Escape' && store.pendingClipboard !== null) {
			e.preventDefault()
			removePreviewTasksFromGrid()
			store.clearSelection()
			return
		}

		if ((e.key === 'n' || e.key === 'N') && store.canCreate) {
			store.openCreateDialog()
		}
	}

	onMounted(() => document.addEventListener('keydown', handleKeyDown))
	onUnmounted(() => {
		document.removeEventListener('keydown', handleKeyDown)
		if (arrowDebounceTimer !== null) clearTimeout(arrowDebounceTimer)
		arrowOriginals = null
		// The undo stack is a module-level singleton shared by both split-view panels, so only the
		// last planner leaving the screen may clear it — otherwise closing one panel throws away the
		// other panel's still-usable history.
		if (!hasOtherInstances()) undoStack.clear()
	})
}
