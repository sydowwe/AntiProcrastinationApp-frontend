import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { useAutoScroll } from '@/_common/composable/general/useAutoScroll.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
import { CreationPreviewType, SLOT_HEIGHT } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
import { type AnyPlannerTask, TaskSpan } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
import { useI18n } from 'vue-i18n'

const MOVEMENT_THRESHOLD = 5
const DOUBLE_CLICK_DELAY = 300
/** How long a finger has to rest on the grid before a touch becomes a drag, a resize or a creation. */
const LONG_PRESS_DELAY = 400

/**
 * A touch that hasn't become a gesture yet. The column is `touch-action: pan-y`, so until the long
 * press fires, the browser is free to take the touch as a scroll, and it says so with `pointercancel`.
 */
type PendingTouch = {
	pointerId: number
	x: number
	y: number
	timer: number
	/** What the long press starts. `null` where only a tap means anything (clipboard placement). */
	arm: (() => void) | null
	/** What a tap — lifted before the long press, without moving — does. `null` where it does nothing. */
	tap: (() => void) | null
}

export function usePlannerPointerInteractions(
	store: AnyDayPlannerStore,
	tasksColumnRef: Ref<HTMLElement | undefined>,
	clipboard: {
		previewTaskIds: Ref<Set<number>>
		addPreviewTasksToGrid: () => void
		removePreviewTasksFromGrid: () => void
	},
) {
	const { showErrorSnackbar } = useSnackbar()
	const undoStack = useUndoStack()
	const { t } = useI18n()
	const calendarGrid = computed(() => tasksColumnRef.value?.parentElement as HTMLElement)
	const { handleAutoScroll, stopAutoScroll } = useAutoScroll(calendarGrid)

	const localCreationPreview = ref<CreationPreviewType | undefined>(undefined)

	const originalTaskState = ref<AnyPlannerTask | null>(null)
	const dragOffset = ref<number>(0)

	const resizeDirection = ref<'top' | 'bottom' | null>(null)

	const pointerStartPos = ref<{ x: number; y: number } | null>(null)
	const hasMovedBeyondThreshold = ref(false)

	const clickTimer = ref<number | null>(null)
	const lastClickedTaskId = ref<number | null>(null)

	// Touch (planner-day/B10, F108). Mouse and pen act on `pointerdown`, as they always have. A finger
	// can't: the same contact is how a phone scrolls the day, so acting on it created a task or moved
	// one under every swipe. A touch therefore does nothing until it has rested for `LONG_PRESS_DELAY`
	// without moving; only then is it armed, and from there on it runs the mouse's gesture code.
	let pendingTouch: PendingTouch | null = null
	let armedTouchPointerId: number | null = null

	function getSlotIndexFromPosition(y: number): number {
		if (!tasksColumnRef.value) return 0
		const rect = tasksColumnRef.value.getBoundingClientRect()
		const relativeY = y - rect.top
		return Math.max(0, Math.min(store.totalGridRows - 1, Math.floor(relativeY / SLOT_HEIGHT)))
	}

	function checkTaskConflictByRow(newStartRow: number, newEndRow: number, taskId?: number): boolean {
		return store.tasks.some(task => {
			if (taskId !== undefined && (taskId ^ task.id) < 0) return false
			if (task.id === taskId || task.isBackground) return false
			return !(newEndRow <= task.gridRowStart || newStartRow >= task.gridRowEnd)
		})
	}

	function beginTouch(e: PointerEvent, arm: PendingTouch['arm'], tap: PendingTouch['tap']): void {
		cancelPendingTouch()
		const pointerId = e.pointerId
		pendingTouch = {
			pointerId,
			x: e.clientX,
			y: e.clientY,
			arm,
			tap,
			timer: window.setTimeout(() => {
				const pending = pendingTouch
				pendingTouch = null
				if (!pending?.arm) return
				armedTouchPointerId = pointerId
				navigator.vibrate?.(10)
				pending.arm()
			}, LONG_PRESS_DELAY),
		}
	}

	function cancelPendingTouch(): void {
		if (pendingTouch) window.clearTimeout(pendingTouch.timer)
		pendingTouch = null
	}

	function startResize(taskId: number, direction: 'top' | 'bottom', x: number, y: number): void {
		const task = store.tasks.find(ev => ev.id === taskId)
		if (!task) return

		store.resizingTaskId = taskId
		resizeDirection.value = direction
		pointerStartPos.value = { x, y }
		hasMovedBeyondThreshold.value = false
		originalTaskState.value = { ...task }
	}

	/**
	 * A resize handle is 8 px tall and sits on every block, so a finger scrolling the day lands on one
	 * as easily as on the block itself. On touch it therefore waits for the long press like everything
	 * else, rather than arming at once as a deliberate target would; a tap on it selects the task.
	 */
	function handleResizeStart(payload: {
		taskId: number
		direction: 'top' | 'bottom'
		pointerEvent: PointerEvent
	}): void {
		const { taskId, direction, pointerEvent: e } = payload
		e.stopPropagation()

		if (e.pointerType === 'touch') {
			beginTouch(
				e,
				() => startResize(taskId, direction, e.clientX, e.clientY),
				() => handleTaskClick(taskId),
			)
			return
		}

		startResize(taskId, direction, e.clientX, e.clientY)
		e.preventDefault()
	}

	/** What a press on `target` would act on, by the same rules for every pointer type. */
	function gestureTargetOf(target: HTMLElement): { kind: 'task'; taskId: number } | { kind: 'slot' } | null {
		if (target.closest('.resize-handle')) return null
		if (target.closest('.v-checkbox.task-checkbox')) return null

		const taskBlock = target.closest('.base-task-block') as HTMLElement
		if (taskBlock) {
			const taskId = parseInt(taskBlock.dataset.taskId || '0')
			return store.tasks.some(ev => ev.id === taskId) ? { kind: 'task', taskId } : null
		}

		if (target.closest('.task-block')) return null
		if (target.closest('.current-time-indicator')) return null
		if (!store.canCreate) return null
		return { kind: 'slot' }
	}

	function startTaskDrag(taskId: number, x: number, y: number): void {
		const task = store.tasks.find(ev => ev.id === taskId)
		if (!task) return

		pointerStartPos.value = { x, y }
		hasMovedBeyondThreshold.value = false

		store.draggingTaskId = taskId
		originalTaskState.value = { ...task }
		const slotIndex = getSlotIndexFromPosition(y)
		dragOffset.value = slotIndex - (task.gridRowStart - 1)
	}

	function startCreation(y: number): void {
		const slotIndex = getSlotIndexFromPosition(y)
		localCreationPreview.value = CreationPreviewType.init(slotIndex + 1)
	}

	function handlePointerDown(e: PointerEvent): void {
		const target = e.target as HTMLElement
		const isTouch = e.pointerType === 'touch'

		if (store.pendingClipboard !== null) {
			if (target.closest('.resize-handle')) return
			// A touch has no hover to preview the placement, and its press may be a scroll — it places on
			// the tap instead, which `placeClipboardAt` checks for a conflict first.
			if (isTouch) {
				const y = e.clientY
				beginTouch(e, null, () => placeClipboardAt(y))
				return
			}
			if (store.clipboardConflict) return
			clipboard.removePreviewTasksFromGrid()
			const slotIndex = getSlotIndexFromPosition(e.clientY)
			store.clipboardPlacementSlot = slotIndex + 1
			e.preventDefault()
			return
		}

		const gestureTarget = gestureTargetOf(target)
		if (!gestureTarget) return

		const { clientX: x, clientY: y } = e
		if (gestureTarget.kind === 'task') {
			const { taskId } = gestureTarget
			if (isTouch) {
				beginTouch(
					e,
					() => startTaskDrag(taskId, x, y),
					() => handleTaskClick(taskId),
				)
			} else {
				startTaskDrag(taskId, x, y)
			}
			return
		}

		// A tap on an empty slot does nothing on touch: the tap that stops a fling lands on one, and it
		// mustn't open *Add New Task*. A long press opens it, and dragging on extends it, as with a mouse.
		if (isTouch) {
			beginTouch(e, () => startCreation(y), null)
			return
		}
		startCreation(y)
		e.preventDefault()
	}

	/** Draws the clipboard's tasks at `y` and records whether they would conflict there. */
	function updateClipboardPreview(y: number): void {
		if (!store.pendingClipboard) return
		if (clipboard.previewTaskIds.value.size === 0) clipboard.addPreviewTasksToGrid()

		const hoverRow = getSlotIndexFromPosition(y) + 1
		const { tasks: clipTasks, mode } = store.pendingClipboard
		const sorted = [...clipTasks].sort((a, b) => a.startTime.getInMinutes - b.startTime.getInMinutes)
		const previewIds = clipboard.previewTaskIds.value
		let anyConflict = false

		for (const task of sorted) {
			const previewId = mode === 'cut' ? task.id : -task.id
			const rowOffset = task.gridRowStart - sorted[0]!.gridRowStart
			const duration = task.gridRowEnd - task.gridRowStart
			const newStartRow = hoverRow + rowOffset
			const newEndRow = newStartRow + duration

			const outOfBounds = newStartRow < 1 || newEndRow > store.totalGridRows + 1
			const hasConflict =
				outOfBounds ||
				store.tasks.some(t => {
					if (previewIds.has(t.id) || t.isBackground) return false
					return !(newEndRow <= t.gridRowStart || newStartRow >= t.gridRowEnd)
				})
			if (hasConflict) anyConflict = true

			store.redrawTask(previewId, {
				gridRowStart: Math.max(1, newStartRow),
				gridRowEnd: Math.max(2, newEndRow),
				startTime: store.slotIndexToTime(Math.max(0, newStartRow - 1)),
				endTime: store.slotIndexToTime(Math.max(1, newEndRow - 1)),
			})
		}

		store.clipboardConflict = anyConflict
	}

	/** The touch path's placement: the mouse's hover preview and click, in one tap. */
	function placeClipboardAt(y: number): void {
		updateClipboardPreview(y)
		const conflict = store.clipboardConflict
		clipboard.removePreviewTasksFromGrid()
		if (conflict) {
			showErrorSnackbar(t('planner.feedback.placementConflict'))
			return
		}
		store.clipboardPlacementSlot = getSlotIndexFromPosition(y) + 1
	}

	function handlePointerMove(e: PointerEvent): void {
		if (e.pointerType === 'touch' && e.pointerId !== armedTouchPointerId) {
			// Not a gesture (yet). Moving off the spot means the finger is going somewhere — a sideways
			// slide, or a scroll the browser hasn't claimed yet — so it can no longer become a long press.
			if (pendingTouch?.pointerId === e.pointerId) {
				const dx = e.clientX - pendingTouch.x
				const dy = e.clientY - pendingTouch.y
				if (Math.sqrt(dx * dx + dy * dy) > MOVEMENT_THRESHOLD) cancelPendingTouch()
			}
			return
		}

		if (store.pendingClipboard !== null) {
			updateClipboardPreview(e.clientY)
			return
		}

		if (pointerStartPos.value && !hasMovedBeyondThreshold.value) {
			const dx = e.clientX - pointerStartPos.value.x
			const dy = e.clientY - pointerStartPos.value.y
			if (Math.sqrt(dx * dx + dy * dy) > MOVEMENT_THRESHOLD) {
				hasMovedBeyondThreshold.value = true
			}
		}

		if (store.draggingTaskId !== null && originalTaskState.value) {
			if (!hasMovedBeyondThreshold.value) return

			handleAutoScroll(e.clientY)

			const currentSlot = getSlotIndexFromPosition(e.clientY)
			const task = store.tasks.find(ev => ev.id === store.draggingTaskId)
			if (!task || task.isBackground) return

			const taskDuration = originalTaskState.value.gridRowEnd - originalTaskState.value.gridRowStart
			const newStartRow = currentSlot - dragOffset.value + 1
			const newEndRow = newStartRow + taskDuration

			const fitsInView = newStartRow >= 1 && newEndRow <= store.totalGridRows + 1
			const hasConflict = checkTaskConflictByRow(newStartRow, newEndRow, store.draggingTaskId)

			store.dragConflict = hasConflict || !fitsInView

			store.redrawTask(store.draggingTaskId, {
				startTime: store.slotIndexToTime(newStartRow - 1),
				endTime: store.slotIndexToTime(newEndRow - 1),
				gridRowStart: newStartRow,
				gridRowEnd: newEndRow,
			})
			return
		}

		if (store.resizingTaskId !== null && resizeDirection.value) {
			if (!hasMovedBeyondThreshold.value) return

			const slotIndex = getSlotIndexFromPosition(e.clientY)
			const task = store.tasks.find(ev => ev.id === store.resizingTaskId)
			if (!task) return

			if (resizeDirection.value === 'top') {
				const newStartRow = slotIndex + 1
				if (
					newStartRow <= task.gridRowEnd &&
					!checkTaskConflictByRow(newStartRow, task.gridRowEnd, store.resizingTaskId)
				) {
					store.redrawTask(store.resizingTaskId, {
						gridRowStart: newStartRow,
						startTime: store.slotIndexToTime(newStartRow - 1),
					})
				}
			} else {
				const newEndRow = slotIndex + 2
				if (
					newEndRow >= task.gridRowStart &&
					!checkTaskConflictByRow(task.gridRowStart, newEndRow, store.resizingTaskId)
				) {
					store.redrawTask(store.resizingTaskId, {
						gridRowEnd: newEndRow,
						endTime: store.slotIndexToTime(newEndRow - 1),
					})
				}
			}
			return
		}

		if (!localCreationPreview.value) return

		const slotIndex = getSlotIndexFromPosition(e.clientY)

		if (slotIndex >= localCreationPreview.value.initRow - 1) {
			const newEndRow = slotIndex + 1
			if (!checkTaskConflictByRow(localCreationPreview.value.startRow, newEndRow)) {
				localCreationPreview.value.endRow = newEndRow
			}
		} else {
			const newStartRow = slotIndex + 1
			if (!checkTaskConflictByRow(newStartRow, localCreationPreview.value.endRow)) {
				localCreationPreview.value.startRow = newStartRow
			}
		}
	}

	/** A click on a task — or a tap on one, on touch — selects it; a second within the delay edits it. */
	function handleTaskClick(taskId: number): void {
		if (clickTimer.value !== null && lastClickedTaskId.value === taskId) {
			clearTimeout(clickTimer.value)
			clickTimer.value = null
			lastClickedTaskId.value = null
			store.openEditDialog()
			store.toggleTaskSelection(taskId)
		} else {
			if (clickTimer.value !== null) clearTimeout(clickTimer.value)
			store.toggleTaskSelection(taskId)
			lastClickedTaskId.value = taskId
			clickTimer.value = window.setTimeout(() => {
				clickTimer.value = null
				lastClickedTaskId.value = null
			}, DOUBLE_CLICK_DELAY)
		}
	}

	function handlePointerUp(e: PointerEvent): void {
		if (pendingTouch?.pointerId === e.pointerId) {
			const { tap } = pendingTouch
			cancelPendingTouch()
			tap?.()
			return
		}
		if (armedTouchPointerId === e.pointerId) armedTouchPointerId = null

		stopAutoScroll()

		if (store.draggingTaskId !== null && originalTaskState.value) {
			const task = store.tasks.find(ev => ev.id === store.draggingTaskId)

			const didMove =
				hasMovedBeyondThreshold.value &&
				task &&
				(task.gridRowStart !== originalTaskState.value.gridRowStart ||
					task.gridRowEnd !== originalTaskState.value.gridRowEnd)

			if (didMove) {
				if (
					task &&
					(store.dragConflict || task.gridRowStart < 1 || task.gridRowEnd > store.totalGridRows + 1)
				) {
					store.redrawTask(store.draggingTaskId, originalTaskState.value)
					showErrorSnackbar(t('planner.feedback.taskDraggedOutsideGrid'))
				} else {
					const capturedOriginal = { ...originalTaskState.value }
					const capturedId = task.id
					const moveDate = store.viewedDate ? new Date(store.viewedDate) : undefined
					store
						.updateTaskSpan(task.id, TaskSpan.fromTask(task))
						.then(() => {
							undoStack.push({
								description: t('planner.undo.taskMoved'),
								date: moveDate,
								undo: async () => {
									store.redrawTask(capturedId, capturedOriginal)
									await store.updateTaskSpan(capturedId, TaskSpan.fromTask(capturedOriginal))
								},
							})
						})
						.catch(() => {
							store.redrawTask(capturedId, capturedOriginal)
						})
						.finally(() => {
							;(document.activeElement as HTMLElement).blur()
						})
				}
			} else {
				handleTaskClick(store.draggingTaskId)
			}

			store.draggingTaskId = null
			dragOffset.value = 0
			store.dragConflict = false
			originalTaskState.value = null
			pointerStartPos.value = null
			hasMovedBeyondThreshold.value = false
			return
		}

		if (store.resizingTaskId !== null) {
			const task = store.tasks.find(ev => ev.id === store.resizingTaskId)

			// Aliased so the `didMove` conjunction narrows both away from null for the block below —
			// reading `originalTaskState.value` through the ref each time does not.
			const original = originalTaskState.value
			const didMove =
				hasMovedBeyondThreshold.value &&
				task &&
				original &&
				(task.gridRowStart !== original.gridRowStart || task.gridRowEnd !== original.gridRowEnd)

			if (didMove) {
				const capturedOriginal = { ...original }
				const capturedId = store.resizingTaskId
				const resizeDate = store.viewedDate ? new Date(store.viewedDate) : undefined
				store
					.updateTaskSpan(store.resizingTaskId, TaskSpan.fromTask(task))
					.then(() => {
						undoStack.push({
							description: t('planner.undo.taskResized'),
							date: resizeDate,
							undo: async () => {
								store.redrawTask(capturedId, capturedOriginal)
								await store.updateTaskSpan(capturedId, TaskSpan.fromTask(capturedOriginal))
							},
						})
					})
					.catch(() => {
						store.redrawTask(capturedId, capturedOriginal)
					})
			}

			store.resizingTaskId = null
			resizeDirection.value = null
			originalTaskState.value = null
			pointerStartPos.value = null
			hasMovedBeyondThreshold.value = false
			return
		}

		if (!localCreationPreview.value) return

		store.creationPreview = localCreationPreview.value
		store.openCreateDialog()
		localCreationPreview.value = undefined
	}

	/**
	 * The browser took the pointer — on touch, because it started scrolling before the long press
	 * fired. Whatever the press had begun is dropped, not committed: nothing was meant.
	 */
	function handlePointerCancel(e: PointerEvent): void {
		if (pendingTouch?.pointerId === e.pointerId) {
			cancelPendingTouch()
			return
		}
		if (armedTouchPointerId === e.pointerId) armedTouchPointerId = null

		stopAutoScroll()
		const original = originalTaskState.value
		const movedTaskId = store.draggingTaskId ?? store.resizingTaskId
		if (movedTaskId !== null && original) store.redrawTask(movedTaskId, original)

		store.draggingTaskId = null
		store.resizingTaskId = null
		store.dragConflict = false
		resizeDirection.value = null
		dragOffset.value = 0
		originalTaskState.value = null
		pointerStartPos.value = null
		hasMovedBeyondThreshold.value = false
		localCreationPreview.value = undefined
	}

	// An armed touch owns the gesture: `pan-y` would otherwise let the browser scroll the day under the
	// task being dragged. Cancelling `touchmove` needs a non-passive listener, which a template's
	// `@touchmove` can't be relied on to register.
	function handleTouchMove(e: TouchEvent): void {
		if (armedTouchPointerId !== null && e.cancelable) e.preventDefault()
	}

	// A long press is also how a phone opens the context menu. Once the press is ours, it isn't one.
	function handleContextMenu(e: Event): void {
		if (armedTouchPointerId !== null || pendingTouch !== null) e.preventDefault()
	}

	// Kept rather than re-read on unmount, when the template ref may already be cleared.
	let column: HTMLElement | undefined

	onMounted(() => {
		document.addEventListener('pointerup', handlePointerUp)
		document.addEventListener('pointercancel', handlePointerCancel)
		column = tasksColumnRef.value
		column?.addEventListener('touchmove', handleTouchMove, { passive: false })
		column?.addEventListener('contextmenu', handleContextMenu)
	})
	onUnmounted(() => {
		cancelPendingTouch()
		document.removeEventListener('pointerup', handlePointerUp)
		document.removeEventListener('pointercancel', handlePointerCancel)
		column?.removeEventListener('touchmove', handleTouchMove)
		column?.removeEventListener('contextmenu', handleContextMenu)
	})

	return { localCreationPreview, handleResizeStart, handlePointerDown, handlePointerMove }
}
