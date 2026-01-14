<!-- TasksColumn.vue -->
<template>
<div
	ref="tasksColumnRef"
	class="tasks-column"
	:style="{ gridTemplateRows: `repeat(${store.totalGridRows}, ${SLOT_HEIGHT}px)` }"
	@pointerdown="handlePointerDown"
	@pointermove="handlePointerMove"
>
	<!-- Time Slots with hover effect -->
	<div
		v-for="(slot, index) in store.timeSlots"
		:key="index"
		:class="['task-slot', { 'hoverable': !creationPreview && !store.isDraggingAny }]"
		:data-slot-index="index"
	/>

	<!-- Midnight divider -->
	<div
		v-if="store.isOverMidnight"
		class="midnight-divider-tasks"
		:style="{ top: `${store.timeToSlotIndex(new Time(0,0)) * SLOT_HEIGHT}px` }"
	/>

	<div
		v-if="isVisible"
		class="current-time-indicator"
		:style="gridRowStyle"
	/>

	<!-- Creation Preview -->
	<CreationPreview
		v-show="creationPreview"
		:preview="creationPreview"
	/>

	<slot name="task-block" v-for="task in store.tasks" :key="task.id" :task="task" :onResizeStart="handleResizeStart">

	</slot>
</div>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {computed, inject, onMounted, ref} from 'vue'
import CreationPreview from './CreationPreview.vue'
import {useAutoScroll} from '@/composables/general/useAutoScroll.ts';
import {useCurrentTimeIndicator} from '@/composables/dayPlanner/useCurrentTimeIndicator.ts';
import {CreationPreviewType, SLOT_HEIGHT} from '@/types/DayPlannerTypes.ts';
import {type IBasePlannerTask, TaskSpan} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {Time} from '@/utils/Time.ts';

const {showErrorSnackbar} = useSnackbar()
// Inject the store from parent DayPlanner component
const store = inject<TStore>('plannerStore')!

const tasksColumnRef = ref<HTMLElement | undefined>(undefined)
const calendarGrid = computed(() => tasksColumnRef.value?.parentElement as HTMLElement)
const {handleAutoScroll, stopAutoScroll} = useAutoScroll(calendarGrid)
const {isVisible, gridRowStyle} = useCurrentTimeIndicator(store)

// Creation state
const creationPreview = ref<CreationPreviewType | undefined>(undefined)

// Drag state (local to TasksColumn - not needed in TaskBlock)
const originalTaskState = ref<TTask | null>(null)
const dragStartSlot = ref<number | null>(null)
const dragOffset = ref<number>(0)

// Resize state (local to TasksColumn - not needed in TaskBlock)
const resizeStartSlot = ref<number | null>(null)
const resizeDirection = ref<'top' | 'bottom' | null>(null)

// Movement tracking to distinguish clicks from drags
const MOVEMENT_THRESHOLD = 5 // pixels
const pointerStartPos = ref<{ x: number; y: number } | null>(null)
const hasMovedBeyondThreshold = ref(false)

// Double-click detection
const DOUBLE_CLICK_DELAY = 300 // ms
const clickTimer = ref<number | null>(null)
const lastClickedTaskId = ref<number | null>(null)

// Helper functions
function getSlotIndexFromPosition(y: number): number {
	if (!tasksColumnRef.value) return 0

	const rect = tasksColumnRef.value.getBoundingClientRect()
	const relativeY = y - rect.top

	return Math.max(0, Math.min(store.totalGridRows - 1, Math.floor(relativeY / SLOT_HEIGHT)))
}

function checkTaskConflictByRow(newStartRow: number, newEndRow: number, taskId?: number): boolean {
	return store.tasks.some(task => {
		if (task.id === taskId || task.isBackground) return false
		return !(newEndRow <= task.gridRowStart || newStartRow >= task.gridRowEnd)
	})
}

function handleResizeStart(payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void {
	const task = store.tasks.find(ev => ev.id === payload.taskId)
	if (!task) return

	store.resizingTaskId = payload.taskId
	resizeDirection.value = payload.direction
	resizeStartSlot.value = task.gridRowStart - 1

	// Track starting position for movement threshold
	pointerStartPos.value = {x: payload.pointerEvent.clientX, y: payload.pointerEvent.clientY}
	hasMovedBeyondThreshold.value = false
	originalTaskState.value = {...task}

	payload.pointerEvent.preventDefault()
	payload.pointerEvent.stopPropagation()
}

function handlePointerDown(e: PointerEvent): void {
	const target = e.target as HTMLElement

	// Check if clicking on a resize handle (handled by TaskBlock)
	if (target.closest('.resize-handle')) return

	if (target.closest('.v-checkbox.task-checkbox')) return


	// Check if clicking on an task to potentially drag it
	const taskBlock = target.closest('.base-task-block') as HTMLElement
	if (taskBlock) {
		const taskId = parseInt(taskBlock.dataset.taskId || '0')
		const task = store.tasks.find(ev => ev.id === taskId)

		if (!task) return

		// Track starting position but don't start dragging yet
		pointerStartPos.value = {x: e.clientX, y: e.clientY}
		hasMovedBeyondThreshold.value = false

		// Prepare for potential drag
		store.draggingTaskId = taskId
		originalTaskState.value = {...task}
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		dragStartSlot.value = slotIndex
		dragOffset.value = slotIndex - (task.gridRowStart - 1)
		console.log('aa')

		return
	}

	// Clear selection when clicking on empty area
	store.clearSelection()

	// Start creating if clicking on empty space
	if (target.closest('.task-block')) return
	if (target.closest('.current-time-indicator')) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)

	creationPreview.value = CreationPreviewType.init(slotIndex + 1);
	e.preventDefault()
}

function handlePointerMove(e: PointerEvent): void {
	// Check if we've moved beyond threshold
	if (pointerStartPos.value && !hasMovedBeyondThreshold.value) {
		const dx = e.clientX - pointerStartPos.value.x
		const dy = e.clientY - pointerStartPos.value.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		if (distance > MOVEMENT_THRESHOLD) {
			hasMovedBeyondThreshold.value = true
		}
	}

	// Handle dragging (only if moved beyond threshold)
	if (store.draggingTaskId !== null && dragStartSlot.value !== null && originalTaskState.value) {
		// Only actually drag if we've moved beyond threshold
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

		store.redrawTask(store.draggingTaskId,
			{
				startTime: store.slotIndexToTime(newStartRow - 1),
				endTime: store.slotIndexToTime(newEndRow - 1),
				gridRowStart: newStartRow,
				gridRowEnd: newEndRow
			} as Partial<TTask>
		)
		return
	}

	// Handle resizing (only if moved beyond threshold)
	if (store.resizingTaskId !== null && resizeDirection.value) {
		// Only actually resize if we've moved beyond threshold
		if (!hasMovedBeyondThreshold.value) return

		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const task = store.tasks.find(ev => ev.id === store.resizingTaskId)
		if (!task) return

		if (resizeDirection.value === 'top') {
			const newStartRow = slotIndex + 1
			if (newStartRow <= task.gridRowEnd && !checkTaskConflictByRow(newStartRow, task.gridRowEnd, store.resizingTaskId)) {
				store.redrawTask(
					store.resizingTaskId,
					{
						gridRowStart: newStartRow,
						startTime: store.slotIndexToTime(newStartRow - 1)
					} as Partial<TTask>
				)
			}
		} else if (resizeDirection.value === 'bottom') {
			const newEndRow = slotIndex + 2
			if (newEndRow >= task.gridRowStart && !checkTaskConflictByRow(task.gridRowStart, newEndRow, store.resizingTaskId)) {
				store.redrawTask(
					store.resizingTaskId,
					{
						gridRowEnd: newEndRow,
						endTime: store.slotIndexToTime(newEndRow - 1)
					} as Partial<TTask>
				)
			}
		}
		return
	}

	// Handle creation
	if (!creationPreview.value) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)

	if (slotIndex >= creationPreview.value.initRow - 1) {
		// Dragging down
		const newEndRow = slotIndex + 1
		if (!checkTaskConflictByRow(creationPreview.value.startRow, newEndRow)) {
			creationPreview.value.endRow = newEndRow
		}
	} else {
		// Dragging up
		const newStartRow = slotIndex + 1
		if (!checkTaskConflictByRow(newStartRow, creationPreview.value.endRow)) {
			creationPreview.value.startRow = newStartRow
		}
	}
}

function handlePointerUp(): void {
	stopAutoScroll()

	// Handle drag end
	if (store.draggingTaskId !== null && originalTaskState.value) {
		const task = store.tasks.find(ev => ev.id === store.draggingTaskId)

		// Check if actual movement occurred
		const didMove = hasMovedBeyondThreshold.value && task &&
			(task.gridRowStart !== originalTaskState.value.gridRowStart ||
				task.gridRowEnd !== originalTaskState.value.gridRowEnd)

		if (didMove) {
			// Handle actual drag - update task position
			if (task && (store.dragConflict || task.gridRowStart < 1 || task.gridRowEnd > store.totalGridRows)) {
				// Revert to original position
				store.redrawTask(store.draggingTaskId, originalTaskState.value)
				showErrorSnackbar('Task cannot be dragged outside of the grid')
			} else {
				// Update the task span
				store.updateTaskSpan(task.id, TaskSpan.fromTask(task))
					.catch((error) => {
						store.redrawTask(store.draggingTaskId!, originalTaskState.value)
					}).finally(() => {
					(document.activeElement as HTMLElement).blur()
				})
			}
		} else {
			// No movement - it was just a click
			const clickedTaskId = store.draggingTaskId


			// Check if this is a double-click (click on same task within delay)
			if (clickTimer.value !== null && lastClickedTaskId.value === clickedTaskId) {
				// Double-click detected - cancel the pending selection toggle
				clearTimeout(clickTimer.value)
				clickTimer.value = null
				lastClickedTaskId.value = null

				store.openEditDialog()
				store.toggleTaskSelection(clickedTaskId)

			} else {
				// Potential first click - delay selection toggle to detect double-click
				if (clickTimer.value !== null) {
					clearTimeout(clickTimer.value)
				}
				store.toggleTaskSelection(clickedTaskId)

				lastClickedTaskId.value = clickedTaskId

				// Set timer to toggle selection after delay (if no second click comes)
				clickTimer.value = window.setTimeout(() => {
					clickTimer.value = null
					lastClickedTaskId.value = null
				}, DOUBLE_CLICK_DELAY)
			}
		}

		// Reset drag state
		store.draggingTaskId = null
		dragStartSlot.value = null
		dragOffset.value = 0
		store.dragConflict = false
		originalTaskState.value = null
		pointerStartPos.value = null
		hasMovedBeyondThreshold.value = false
		return
	}

	// Handle resize end
	if (store.resizingTaskId !== null) {
		const task = store.tasks.find(ev => ev.id === store.resizingTaskId)

		// Check if actual movement occurred
		const didMove = hasMovedBeyondThreshold.value && task && originalTaskState.value &&
			(task.gridRowStart !== originalTaskState.value.gridRowStart ||
				task.gridRowEnd !== originalTaskState.value.gridRowEnd)

		if (didMove) {
			// Handle actual resize - update task span
			store.updateTaskSpan(store.resizingTaskId, TaskSpan.fromTask(task!))
				.catch((error) => {
					store.redrawTask(store.resizingTaskId!, originalTaskState.value)
				})
		}
		// Note: Don't toggle selection on resize handle click

		// Reset resize state
		store.resizingTaskId = null
		resizeStartSlot.value = null
		resizeDirection.value = null
		originalTaskState.value = null
		pointerStartPos.value = null
		hasMovedBeyondThreshold.value = false
		return
	}

	// Handle creation end
	if (!creationPreview.value) return

	const startTime = store.slotIndexToTime(creationPreview.value.startRow - 1)
	const endTime = store.slotIndexToTime(creationPreview.value.endRow)

	store.openCreateDialogPrefilled(startTime, endTime)

	creationPreview.value = undefined;
}


onMounted(() => {
	document.addEventListener('pointerup', handlePointerUp)
})

</script>

<style scoped>
.tasks-column {
	display: grid;
	position: relative;
	background: rgb(var(--v-theme-neutral-100));
	user-select: none;
	cursor: crosshair;
	touch-action: none;
}

.task-slot {
	border-top: 2px solid #9993;
	transition: background-color 0.2s ease;
}

.task-slot:nth-of-type(3n+1) {
	border-top-width: 2px;
	border-top-color: #999B;
}

.task-slot.hoverable:hover {
	background-color: rgba(0, 0, 0, 0.02);
	cursor: cell;
}

.midnight-divider-tasks {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(15, 39, 124);
	z-index: 20;
	pointer-tasks: none;
}

.current-time-indicator {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, rgb(var(--v-theme-secondary)) 0%, rgb(var(--v-theme-primary)) 100%);
	z-index: 20;
	pointer-tasks: none;
	box-shadow: 0 2px 8px rgba(var(--v-theme-secondary), 0.5);
}
</style>