<!-- EventsColumn.vue -->
<template>
<div
	ref="eventsColumnRef"
	class="events-column"
	:style="{ gridTemplateRows: `repeat(${store.totalGridRows}, ${SLOT_HEIGHT}px)` }"
	@pointerdown="handlePointerDown"
	@pointermove="handlePointerMove"
>
	<!-- Time Slots with hover effect -->
	<div
		v-for="(slot, index) in store.timeSlots"
		:key="index"
		:class="['event-slot', { 'hoverable': !creationPreview && !store.isDraggingAny }]"
		:data-slot-index="index"
	/>

	<!-- Midnight divider -->
	<div
		class="midnight-divider-events"
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

	<slot name="event-block" v-for="event in store.events" :key="event.id" :event="event" :onResizeStart="handleResizeStart">

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
import {Time} from '@/utils/Time.ts';

// Inject the store from parent DayPlanner component
const store = inject<TStore>('plannerStore')!

const eventsColumnRef = ref<HTMLElement | undefined>(undefined)
const calendarGrid = computed(() => eventsColumnRef.value?.parentElement as HTMLElement)
const {handleAutoScroll, stopAutoScroll} = useAutoScroll(calendarGrid)
const {isVisible, gridRowStyle} = useCurrentTimeIndicator(store)

// Creation state
const creationPreview = ref<CreationPreviewType | undefined>(undefined)

// Drag state (local to EventsColumn - not needed in EventBlock)
const originalEventState = ref<TTask | null>(null)
const dragStartSlot = ref<number | null>(null)
const dragOffset = ref<number>(0)

// Resize state (local to EventsColumn - not needed in EventBlock)
const resizeStartSlot = ref<number | null>(null)
const resizeDirection = ref<'top' | 'bottom' | null>(null)

// Movement tracking to distinguish clicks from drags
const MOVEMENT_THRESHOLD = 5 // pixels
const pointerStartPos = ref<{ x: number; y: number } | null>(null)
const hasMovedBeyondThreshold = ref(false)

// Double-click detection
const DOUBLE_CLICK_DELAY = 300 // ms
const clickTimer = ref<number | null>(null)
const lastClickedEventId = ref<number | null>(null)

// Helper functions
function getSlotIndexFromPosition(y: number): number {
	if (!eventsColumnRef.value) return 0

	const rect = eventsColumnRef.value.getBoundingClientRect()
	const relativeY = y - rect.top
	const slotHeight = rect.height / store.totalGridRows

	return Math.max(0, Math.min(store.totalGridRows - 1, Math.floor(relativeY / slotHeight)))
}

function checkEventConflictByRow(newStartRow: number, newEndRow: number, eventId?: number): boolean {
	return store.events.some(event => {
		if (event.id === eventId || event.isBackground) return false
		return !(newEndRow <= event.gridRowStart || newStartRow >= event.gridRowEnd)
	})
}

function handleResizeStart(payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void {
	const event = store.events.find(ev => ev.id === payload.eventId)
	if (!event) return

	store.resizingEventId = payload.eventId
	resizeDirection.value = payload.direction
	resizeStartSlot.value = event.gridRowStart - 1

	// Track starting position for movement threshold
	pointerStartPos.value = {x: payload.$event.clientX, y: payload.$event.clientY}
	hasMovedBeyondThreshold.value = false
	originalEventState.value = {...event}

	payload.$event.preventDefault()
	payload.$event.stopPropagation()
}

function handlePointerDown(e: PointerEvent): void {
	const target = e.target as HTMLElement

	// Check if clicking on a resize handle (handled by EventBlock)
	if (target.closest('.resize-handle')) return

	// Check if clicking on an event to potentially drag it
	const eventBlock = target.closest('.event-block') as HTMLElement
	if (eventBlock && !eventBlock.classList.contains('background-event-block')) {
		const eventId = parseInt(eventBlock.dataset.eventId || '0')
		const event = store.events.find(ev => ev.id === eventId)
		if (!event || event.isBackground) return

		// Track starting position but don't start dragging yet
		pointerStartPos.value = {x: e.clientX, y: e.clientY}
		hasMovedBeyondThreshold.value = false

		// Prepare for potential drag
		store.draggingEventId = eventId
		originalEventState.value = {...event}

		const slotIndex = getSlotIndexFromPosition(e.clientY)
		dragStartSlot.value = slotIndex
		dragOffset.value = slotIndex - (event.gridRowStart - 1)
		return
	}

	// Clear selection when clicking on empty area
	store.clearSelection()

	// Start creating if clicking on empty space
	if (target.closest('.event-block')) return
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
	if (store.draggingEventId !== null && dragStartSlot.value !== null && originalEventState.value) {
		// Only actually drag if we've moved beyond threshold
		if (!hasMovedBeyondThreshold.value) return

		handleAutoScroll(e.clientY)

		const currentSlot = getSlotIndexFromPosition(e.clientY)
		const event = store.events.find(ev => ev.id === store.draggingEventId)
		if (!event) return

		const eventDuration = originalEventState.value.gridRowEnd - originalEventState.value.gridRowStart
		const newStartRow = currentSlot - dragOffset.value + 1
		const newEndRow = newStartRow + eventDuration

		const fitsInView = newStartRow >= 1 && newEndRow <= store.totalGridRows
		const hasConflict = checkEventConflictByRow(newStartRow, newEndRow, store.draggingEventId)

		store.dragConflict = hasConflict || !fitsInView

		store.redrawTask(store.draggingEventId,
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
	if (store.resizingEventId !== null && resizeDirection.value) {
		// Only actually resize if we've moved beyond threshold
		if (!hasMovedBeyondThreshold.value) return

		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const event = store.events.find(ev => ev.id === store.resizingEventId)
		if (!event) return

		if (resizeDirection.value === 'top') {
			const newStartRow = slotIndex + 1
			if (newStartRow <= event.gridRowEnd && !checkEventConflictByRow(newStartRow, event.gridRowEnd, store.resizingEventId)) {
				store.redrawTask(
					store.resizingEventId,
					{
						gridRowStart: newStartRow,
						startTime: store.slotIndexToTime(newStartRow - 1)
					} as Partial<TTask>
				)
			}
		} else if (resizeDirection.value === 'bottom') {
			const newEndRow = slotIndex + 1
			if (newEndRow >= event.gridRowStart && !checkEventConflictByRow(event.gridRowStart, newEndRow, store.resizingEventId)) {
				store.redrawTask(
					store.resizingEventId,
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
		if (!checkEventConflictByRow(creationPreview.value.startRow, newEndRow)) {
			creationPreview.value.endRow = newEndRow
		}
	} else {
		// Dragging up
		const newStartRow = slotIndex + 1
		if (!checkEventConflictByRow(newStartRow, creationPreview.value.endRow)) {
			creationPreview.value.startRow = newStartRow
		}
	}
}

function handlePointerUp(): void {
	stopAutoScroll()

	// Handle drag end
	if (store.draggingEventId !== null && originalEventState.value) {
		const event = store.events.find(ev => ev.id === store.draggingEventId)

		// Check if actual movement occurred
		const didMove = hasMovedBeyondThreshold.value && event &&
			(event.gridRowStart !== originalEventState.value.gridRowStart ||
				event.gridRowEnd !== originalEventState.value.gridRowEnd)

		if (didMove) {
			// Handle actual drag - update task position
			if (event && (store.dragConflict || event.gridRowStart < 1 || event.gridRowEnd > store.totalGridRows)) {
				// Revert to original position
				store.redrawTask(store.draggingEventId, originalEventState.value)
				store.conflictSnackbar = true
			} else {
				// Update the task span
				store.updateTaskSpan(event.id, TaskSpan.fromTask(event))
					.catch((error) => {
						store.redrawTask(store.draggingEventId!, originalEventState.value)
					}).finally(() => {
					(document.activeElement as HTMLElement).blur()
				})
			}
		} else {
			// No movement - it was just a click
			const clickedEventId = store.draggingEventId

			// Check if this is a double-click (click on same event within delay)
			if (clickTimer.value !== null && lastClickedEventId.value === clickedEventId) {
				// Double-click detected - cancel the pending selection toggle
				clearTimeout(clickTimer.value)
				clickTimer.value = null
				lastClickedEventId.value = null

				// Open edit dialog for the clicked event without changing selection
				const event = store.events.find(e => e.id === clickedEventId)
				if (event) {
					store.editedId = event.id
					store.editingTask = {
						activityId: event.activity.id,
						startTime: event.startTime,
						endTime: event.endTime,
						isBackground: event.isBackground,
						isOptional: event.isOptional,
						location: event.location,
						notes: event.notes,
						priorityId: event.priority?.id
					} as TTaskRequest
					store.dialog = true
				}
			} else {
				// Potential first click - delay selection toggle to detect double-click
				if (clickTimer.value !== null) {
					clearTimeout(clickTimer.value)
				}

				lastClickedEventId.value = clickedEventId

				// Set timer to toggle selection after delay (if no second click comes)
				clickTimer.value = window.setTimeout(() => {
					store.toggleEventSelection(clickedEventId)
					clickTimer.value = null
					lastClickedEventId.value = null
				}, DOUBLE_CLICK_DELAY)
			}
		}

		// Reset drag state
		store.draggingEventId = null
		dragStartSlot.value = null
		dragOffset.value = 0
		store.dragConflict = false
		originalEventState.value = null
		pointerStartPos.value = null
		hasMovedBeyondThreshold.value = false
		return
	}

	// Handle resize end
	if (store.resizingEventId !== null) {
		const event = store.events.find(ev => ev.id === store.resizingEventId)

		// Check if actual movement occurred
		const didMove = hasMovedBeyondThreshold.value && event && originalEventState.value &&
			(event.gridRowStart !== originalEventState.value.gridRowStart ||
				event.gridRowEnd !== originalEventState.value.gridRowEnd)

		if (didMove) {
			// Handle actual resize - update task span
			store.updateTaskSpan(store.resizingEventId, TaskSpan.fromTask(event!))
				.catch((error) => {
					store.redrawTask(store.resizingEventId!, originalEventState.value)
				})
		}
		// Note: Don't toggle selection on resize handle click

		// Reset resize state
		store.resizingEventId = null
		resizeStartSlot.value = null
		resizeDirection.value = null
		originalEventState.value = null
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
.events-column {
	display: grid;
	position: relative;
	background: rgb(var(--v-theme-neutral-100));
	user-select: none;
	cursor: crosshair;
	touch-action: none;
}

.event-slot {
	border-top: 2px dotted #999;
	transition: background-color 0.2s ease;
}

.event-slot:nth-of-type(3n+1) {
	border-top-style: solid;
}

.event-slot.hoverable:hover {
	background-color: rgba(0, 0, 0, 0.02);
	cursor: cell;
}

.midnight-divider-events {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(15, 39, 124);
	z-index: 20;
	pointer-events: none;
}

.current-time-indicator {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, rgb(var(--v-theme-secondary)) 0%, rgb(var(--v-theme-primary)) 100%);
	z-index: 20;
	pointer-events: none;
	box-shadow: 0 2px 8px rgba(var(--v-theme-secondary), 0.5);
}
</style>