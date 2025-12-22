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

	<slot name="event-block" v-for="event in store.visibleEvents" :key="event.id" :event="event" :onResizeStart="handleResizeStart">

	</slot>
</div>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {computed, onMounted, ref} from 'vue'
import CreationPreview from './CreationPreview.vue'
import {useAutoScroll} from '@/composables/general/useAutoScroll.ts';
import {useCurrentTimeIndicator} from '@/composables/dayPlanner/useCurrentTimeIndicator.ts';
import {CreationPreviewType, SLOT_HEIGHT} from '@/types/DayPlannerTypes.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {Time} from '@/utils/Time.ts';

const {store} = defineProps<{
	store: TStore
}>()

const eventsColumnRef = ref<HTMLElement | undefined>(undefined)
const calendarGrid = computed(() => eventsColumnRef.value?.parentElement as HTMLElement)
const {handleAutoScroll, stopAutoScroll} = useAutoScroll(calendarGrid)
const {isVisible, gridRowStyle} = useCurrentTimeIndicator()

// Creation state
const creationPreview = ref<CreationPreviewType | undefined>(undefined)

// Drag state (local to EventsColumn - not needed in EventBlock)
const originalEventState = ref<TTask | null>(null)
const dragStartSlot = ref<number | null>(null)
const dragOffset = ref<number>(0)

// Resize state (local to EventsColumn - not needed in EventBlock)
const resizeStartSlot = ref<number | null>(null)
const resizeDirection = ref<'top' | 'bottom' | null>(null)

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
		return !(newEndRow < event.gridRowStart || newStartRow > event.gridRowEnd)
	})
}

function handleResizeStart(payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void {
	const event = store.events.find(ev => ev.id === payload.eventId)
	if (!event) return

	store.resizingEventId = payload.eventId
	resizeDirection.value = payload.direction
	resizeStartSlot.value = event.gridRowStart - 1

	payload.$event.preventDefault()
	payload.$event.stopPropagation()
}

function handlePointerDown(e: PointerEvent): void {
	const target = e.target as HTMLElement

	// Check if clicking on a resize handle (handled by EventBlock)
	if (target.closest('.resize-handle')) return

	// Check if clicking on an event to drag it
	const eventBlock = target.closest('.event-block') as HTMLElement
	if (eventBlock && !eventBlock.classList.contains('background-event-block')) {
		const eventId = parseInt(eventBlock.dataset.eventId || '0')
		const event = store.events.find(ev => ev.id === eventId)
		if (!event || event.isBackground) return


		store.draggingEventId = eventId
		originalEventState.value = {...event}

		const slotIndex = getSlotIndexFromPosition(e.clientY)
		dragStartSlot.value = slotIndex
		dragOffset.value = slotIndex - (event.gridRowStart - 1)
		return
	}

	// Start creating if clicking on empty space
	if (target.closest('.event-block')) return
	if (target.closest('.current-time-indicator')) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)

	creationPreview.value = CreationPreviewType.init(slotIndex + 1);

	e.preventDefault()
}

function handlePointerMove(e: PointerEvent): void {
	// Handle dragging
	if (store.draggingEventId !== null && dragStartSlot.value !== null && originalEventState.value) {
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

		emit('updatedTaskSpan', {
			eventId: store.draggingEventId,
			updates: {
				startTime: store.slotIndexToTime(newStartRow - 1),
				endTime: store.slotIndexToTime(newEndRow),
				gridRowStart: newStartRow,
				gridRowEnd: newEndRow
			} as Partial<TTask>
		})
		return
	}

	// Handle resizing
	if (store.resizingEventId !== null && resizeDirection.value) {
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const event = store.events.find(ev => ev.id === store.resizingEventId)
		if (!event) return

		if (resizeDirection.value === 'top') {
			const newStartRow = slotIndex + 1
			if (newStartRow <= event.gridRowEnd && !checkEventConflictByRow(newStartRow, event.gridRowEnd, store.resizingEventId)) {
				emit('updatedTaskSpan', {
					eventId: store.resizingEventId,
					updates: {
						gridRowStart: newStartRow,
						startTime: store.slotIndexToTime(newStartRow - 1)
					} as Partial<TTask>
				})
			}
		} else if (resizeDirection.value === 'bottom') {
			const newEndRow = slotIndex + 1
			if (newEndRow >= event.gridRowStart && !checkEventConflictByRow(event.gridRowStart, newEndRow, store.resizingEventId)) {
				emit('updatedTaskSpan', {
					eventId: store.resizingEventId,
					updates: {
						gridRowEnd: newEndRow,
						endTime:
							store.slotIndexToTime(newEndRow)
					} as Partial<TTask>
				})
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

		if (event && (store.dragConflict || event.gridRowStart < 1 || event.gridRowEnd > store.totalGridRows)) {
			// Revert to original position
			emit('updatedTaskSpan', {eventId: store.draggingEventId, updates: originalEventState.value})
			store.conflictSnackbar = true
		}

		// Only remove focus if the event actually moved
		const didMove = event && (event.gridRowStart !== originalEventState.value.gridRowStart || event.gridRowEnd !== originalEventState.value.gridRowEnd)
		if (didMove) {
			store.handleFocusEvent(null);
			(document.activeElement as HTMLElement).blur()
		}

		store.draggingEventId = null
		dragStartSlot.value = null
		dragOffset.value = 0
		store.dragConflict = false
		originalEventState.value = null
		return
	}

	// Handle resize end
	if (store.resizingEventId !== null) {
		store.resizingEventId = null
		resizeStartSlot.value = null
		resizeDirection.value = null
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

const emit = defineEmits<{
	updatedTaskSpan: [payload: { eventId: number; updates: Partial<TTask> }]
}>()
</script>

<style scoped>
.events-column {
	display: grid;
	position: relative;
	background: rgb(var(--v-theme-neutral-200));
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