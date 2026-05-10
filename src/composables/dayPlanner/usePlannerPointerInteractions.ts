import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { useAutoScroll } from '@/composables/general/useAutoScroll.ts'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
import { useUndoStack } from '@/composables/general/useUndoStack.ts'
import { CreationPreviewType, SLOT_HEIGHT } from '@/components/dayPlanner/DayPlannerTypes.ts'
import { type IBasePlannerTask, TaskSpan } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'

const MOVEMENT_THRESHOLD = 5
const DOUBLE_CLICK_DELAY = 300

export function usePlannerPointerInteractions<
	TTask extends IBasePlannerTask<TTaskRequest>,
	TTaskRequest extends IBasePlannerTaskRequest,
>(
	store: IBaseDayPlannerStore<TTask, TTaskRequest>,
	tasksColumnRef: Ref<HTMLElement | undefined>,
	clipboard: {
		previewTaskIds: Ref<Set<number>>
		addPreviewTasksToGrid: () => void
		removePreviewTasksFromGrid: () => void
	},
) {
	const { showErrorSnackbar } = useSnackbar()
	const undoStack = useUndoStack()
	const calendarGrid = computed(() => tasksColumnRef.value?.parentElement as HTMLElement)
	const { handleAutoScroll, stopAutoScroll } = useAutoScroll(calendarGrid)

	const localCreationPreview = ref<CreationPreviewType | undefined>(undefined)

	const originalTaskState = ref<TTask | null>(null)
	const dragOffset = ref<number>(0)

	const resizeDirection = ref<'top' | 'bottom' | null>(null)

	const pointerStartPos = ref<{ x: number; y: number } | null>(null)
	const hasMovedBeyondThreshold = ref(false)

	const clickTimer = ref<number | null>(null)
	const lastClickedTaskId = ref<number | null>(null)

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

	function handleResizeStart(payload: {
		taskId: number
		direction: 'top' | 'bottom'
		pointerEvent: PointerEvent
	}): void {
		const task = store.tasks.find(ev => ev.id === payload.taskId)
		if (!task) return

		store.resizingTaskId = payload.taskId
		resizeDirection.value = payload.direction
		pointerStartPos.value = { x: payload.pointerEvent.clientX, y: payload.pointerEvent.clientY }
		hasMovedBeyondThreshold.value = false
		originalTaskState.value = { ...task }

		payload.pointerEvent.preventDefault()
		payload.pointerEvent.stopPropagation()
	}

	function handlePointerDown(e: PointerEvent): void {
		const target = e.target as HTMLElement

		if (store.pendingClipboard !== null) {
			if (target.closest('.resize-handle')) return
			if (store.clipboardConflict) return
			clipboard.removePreviewTasksFromGrid()
			const slotIndex = getSlotIndexFromPosition(e.clientY)
			store.clipboardPlacementSlot = slotIndex + 1
			e.preventDefault()
			return
		}

		if (target.closest('.resize-handle')) return
		if (target.closest('.v-checkbox.task-checkbox')) return

		const taskBlock = target.closest('.base-task-block') as HTMLElement
		if (taskBlock) {
			const taskId = parseInt(taskBlock.dataset.taskId || '0')
			const task = store.tasks.find(ev => ev.id === taskId)
			if (!task) return

			pointerStartPos.value = { x: e.clientX, y: e.clientY }
			hasMovedBeyondThreshold.value = false

			store.draggingTaskId = taskId
			originalTaskState.value = { ...task }
			const slotIndex = getSlotIndexFromPosition(e.clientY)
			dragOffset.value = slotIndex - (task.gridRowStart - 1)
			return
		}

		if (target.closest('.task-block')) return
		if (target.closest('.current-time-indicator')) return
		if (!store.canCreate) return

		const slotIndex = getSlotIndexFromPosition(e.clientY)
		localCreationPreview.value = CreationPreviewType.init(slotIndex + 1)
		e.preventDefault()
	}

	function handlePointerMove(e: PointerEvent): void {
		if (store.pendingClipboard !== null) {
			if (clipboard.previewTaskIds.value.size === 0) clipboard.addPreviewTasksToGrid()

			const hoverRow = getSlotIndexFromPosition(e.clientY) + 1
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
				} as Partial<TTask>)
			}

			store.clipboardConflict = anyConflict
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
			} as Partial<TTask>)
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
					} as Partial<TTask>)
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
					} as Partial<TTask>)
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

	function handlePointerUp(): void {
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
					showErrorSnackbar('Task cannot be dragged outside of the grid')
				} else {
					const capturedOriginal = { ...originalTaskState.value } as TTask
					const capturedId = task.id
					const moveDate = store.viewedDate ? new Date(store.viewedDate) : undefined
					store
						.updateTaskSpan(task.id, TaskSpan.fromTask(task))
						.then(() => {
							undoStack.push({
								description: 'Task moved',
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
				const clickedTaskId = store.draggingTaskId

				if (clickTimer.value !== null && lastClickedTaskId.value === clickedTaskId) {
					clearTimeout(clickTimer.value)
					clickTimer.value = null
					lastClickedTaskId.value = null
					store.openEditDialog()
					store.toggleTaskSelection(clickedTaskId)
				} else {
					if (clickTimer.value !== null) clearTimeout(clickTimer.value)
					store.toggleTaskSelection(clickedTaskId)
					lastClickedTaskId.value = clickedTaskId
					clickTimer.value = window.setTimeout(() => {
						clickTimer.value = null
						lastClickedTaskId.value = null
					}, DOUBLE_CLICK_DELAY)
				}
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

			const didMove =
				hasMovedBeyondThreshold.value &&
				task &&
				originalTaskState.value &&
				(task.gridRowStart !== originalTaskState.value.gridRowStart ||
					task.gridRowEnd !== originalTaskState.value.gridRowEnd)

			if (didMove) {
				const capturedOriginal = { ...originalTaskState.value } as TTask
				const capturedId = store.resizingTaskId!
				const resizeDate = store.viewedDate ? new Date(store.viewedDate) : undefined
				store
					.updateTaskSpan(store.resizingTaskId, TaskSpan.fromTask(task!))
					.then(() => {
						undoStack.push({
							description: 'Task resized',
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

	onMounted(() => document.addEventListener('pointerup', handlePointerUp))
	onUnmounted(() => document.removeEventListener('pointerup', handlePointerUp))

	return { localCreationPreview, handleResizeStart, handlePointerDown, handlePointerMove }
}
