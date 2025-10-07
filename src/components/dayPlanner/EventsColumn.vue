<!-- EventsColumn.vue -->
<template>
<div
	ref="eventsColumnRef"
	class="events-column"
	:style="{ gridTemplateRows: `repeat(${totalGridRows}, ${SLOT_HEIGHT}px)` }"
	@pointerdown="handlePointerDown"
	@pointermove="handlePointerMove"
	@pointerup="handlePointerUp"
>
	<!-- Time Slots with hover effect -->
	<div
		v-for="(slot, index) in timeSlots"
		:key="index"
		:class="['event-slot', { 'hoverable': !isCreating && !isDraggingAny }]"
		:data-slot-index="index"
	/>

	<!-- Midnight divider -->
	<div
		class="midnight-divider-events"
		:style="{ top: `${timeToSlotIndex('00:00') * SLOT_HEIGHT}px` }"
	/>

	<div
		v-if="isVisible"
		class="current-time-indicator"
		:style="gridRowStyle"
	/>

	<!-- Creation Preview -->
	<CreationPreview
		:preview="creationPreview"
	/>

	<!-- Event Blocks -->
	<EventBlock
		v-for="event in events"
		:key="event.id"
		:event="event"
		:isFocused="focusedEventId === event.id"
		:isDragging="draggingEventId === event.id"
		:isResizing="resizingEventId === event.id"
		:isConflict="dragConflict && draggingEventId === event.id"
		:isPast="isEventPast(event)"
		:isAnyEventBeingManipulated="isDraggingAny || isResizingAny"
		@focus="handleEventFocus"
		@blur="handleEventBlur"
		@edit="$emit('editEvent')"
		@resizeStart="handleResizeStart"
	/>
</div>
</template>

<script setup lang="ts">
import {ref, computed, onUnmounted} from 'vue'
import {type MyEvent, type CreationPreviewType, SLOT_HEIGHT} from '@/classes/types/DayPlannerTypes'
import EventBlock from './EventBlock.vue'
import CreationPreview from './CreationPreview.vue'
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts';
import {useDayPlanner} from '@/components/dayPlanner/useDayPlanner.ts';
import {useCurrentTimeIndicator} from '@/components/dayPlanner/useCurrentTimeIndicator.ts';

const {isVisible, gridRowStyle} = useCurrentTimeIndicator()
const {currentTime} = useCurrentTime()
const {totalGridRows, timeSlots, timeSlotDuration, slotIndexToTime, dateTimeFromSlotIndex, timeToSlotIndex} = useDayPlanner()

interface Props {
	events: MyEvent[]
}

interface Emits {
	(e: 'createEvent', payload: { startTime: string; endTime: string; gridRowStart: number; gridRowEnd: number }): void

	(e: 'updateEvent', payload: { eventId: number; updates: Partial<MyEvent> }): void

	(e: 'conflictDetected'): void

	(e: 'editEvent'): void

	(e: 'focusEvent', eventId: number | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const eventsColumnRef = ref<HTMLElement | null>(null)
const focusedEventId = ref<number | null>(null)

// Creation state
const isCreating = ref(false)
const creationStart = ref<number | null>(null)
const creationEnd = ref<number | null>(null)
const creationPreview = ref<CreationPreviewType | null>(null)

// Drag state
const draggingEventId = ref<number | null>(null)
const dragConflict = ref(false)
const originalEventState = ref<MyEvent | null>(null)
const dragStartSlot = ref<number | null>(null)
const dragOffset = ref<number>(0)

// Resize state
const resizingEventId = ref<number | null>(null)
const resizeStartSlot = ref<number | null>(null)
const resizeDirection = ref<'top' | 'bottom' | null>(null)

// Auto-scroll state
const autoScrollInterval = ref<ReturnType<typeof setInterval> | null>(null)
const autoScrollSpeed = ref<number>(0)
const SCROLL_THRESHOLD = 30
const MAX_SCROLL_SPEED = 15

// Computed
const isDraggingAny = computed(() => draggingEventId.value !== null)
const isResizingAny = computed(() => resizingEventId.value !== null)

// Helper functions
const getSlotIndexFromPosition = (y: number): number => {
	if (!eventsColumnRef.value) return 0

	const rect = eventsColumnRef.value.getBoundingClientRect()
	const relativeY = y - rect.top
	const slotHeight = rect.height / totalGridRows.value

	return Math.max(0, Math.min(totalGridRows.value - 1, Math.floor(relativeY / slotHeight)))
}

const isEventPast = (event: MyEvent): boolean => {
	const endDate = new Date(event.end)
	return endDate < currentTime.value
}

const checkEventConflict = (eventId: number, newStartRow: number, newEndRow: number): boolean => {
	return props.events.some(event => {
		if (event.id === eventId || event.isBackground) return false
		return !(newEndRow < event.gridRowStart || newStartRow > event.gridRowEnd)
	})
}

// Auto-scroll functionality
const handleAutoScroll = (clientY: number): void => {
	if (!eventsColumnRef.value) return

	const calendarGrid = eventsColumnRef.value.closest('.calendar-grid') as HTMLElement
	if (!calendarGrid) return

	const rect = calendarGrid.getBoundingClientRect()
	const distanceFromTop = clientY - rect.top
	const distanceFromBottom = rect.bottom - clientY

	if (autoScrollInterval.value) {
		clearInterval(autoScrollInterval.value)
		autoScrollInterval.value = null
	}

	if (distanceFromTop < SCROLL_THRESHOLD && distanceFromTop > 0) {
		const intensity = 1 - (distanceFromTop / SCROLL_THRESHOLD)
		autoScrollSpeed.value = -intensity * MAX_SCROLL_SPEED

		autoScrollInterval.value = setInterval(() => {
			if (calendarGrid) {
				calendarGrid.scrollTop += autoScrollSpeed.value
			}
		}, 16)
	} else if (distanceFromBottom < SCROLL_THRESHOLD && distanceFromBottom > 0) {
		const intensity = 1 - (distanceFromBottom / SCROLL_THRESHOLD)
		autoScrollSpeed.value = intensity * MAX_SCROLL_SPEED

		autoScrollInterval.value = setInterval(() => {
			if (calendarGrid) {
				calendarGrid.scrollTop += autoScrollSpeed.value
			}
		}, 16)
	}
}

const stopAutoScroll = (): void => {
	if (autoScrollInterval.value) {
		clearInterval(autoScrollInterval.value)
		autoScrollInterval.value = null
	}
	autoScrollSpeed.value = 0
}

// Event handlers
const handleEventFocus = (eventId: number): void => {
	focusedEventId.value = eventId
	emit('focusEvent', eventId)
}

const handleEventBlur = (): void => {
	focusedEventId.value = null
	emit('focusEvent', null)
}

const handleResizeStart = (payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void => {
	const event = props.events.find(ev => ev.id === payload.eventId)
	if (!event) return

	resizingEventId.value = payload.eventId
	resizeDirection.value = payload.direction
	resizeStartSlot.value = event.gridRowStart - 1

	payload.$event.preventDefault()
	payload.$event.stopPropagation()
}

const handlePointerDown = (e: PointerEvent): void => {
	const target = e.target as HTMLElement

	// Check if clicking on a resize handle (handled by EventBlock)
	if (target.closest('.resize-handle')) return

	// Check if clicking on an event to drag it
	const eventBlock = target.closest('.event-block') as HTMLElement
	if (eventBlock && !eventBlock.classList.contains('background-event-block')) {
		const eventId = parseInt(eventBlock.dataset.eventId || '0')
		const event = props.events.find(ev => ev.id === eventId)
		if (!event || event.isBackground) return

		draggingEventId.value = eventId
		originalEventState.value = {...event}

		const slotIndex = getSlotIndexFromPosition(e.clientY)
		dragStartSlot.value = slotIndex
		dragOffset.value = slotIndex - (event.gridRowStart - 1)

		e.preventDefault()
		e.stopPropagation()
		return
	}

	// Start creating if clicking on empty space
	if (target.closest('.event-block')) return
	if (target.closest('.current-time-indicator')) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)
	isCreating.value = true
	creationStart.value = slotIndex
	creationEnd.value = slotIndex

	creationPreview.value = {
		startRow: slotIndex + 1,
		endRow: slotIndex + 1
	}

	e.preventDefault()
}

const handlePointerMove = (e: PointerEvent): void => {
	// Handle dragging
	if (draggingEventId.value !== null && dragStartSlot.value !== null && originalEventState.value) {
		handleAutoScroll(e.clientY)

		const currentSlot = getSlotIndexFromPosition(e.clientY)
		const event = props.events.find(ev => ev.id === draggingEventId.value)
		if (!event) return

		const eventDuration = originalEventState.value.gridRowEnd - originalEventState.value.gridRowStart
		const newStartRow = currentSlot - dragOffset.value + 1
		const newEndRow = newStartRow + eventDuration

		const fitsInView = newStartRow >= 1 && newEndRow <= totalGridRows.value
		const hasConflict = checkEventConflict(draggingEventId.value, newStartRow, newEndRow)

		dragConflict.value = hasConflict || !fitsInView

		emit('updateEvent', {
			eventId: draggingEventId.value,
			updates: {
				gridRowStart: newStartRow,
				gridRowEnd: newEndRow,
				start: dateTimeFromSlotIndex.value(newStartRow - 1),
				end: dateTimeFromSlotIndex.value(newEndRow)
			}
		})
		return
	}

	// Handle resizing
	if (resizingEventId.value !== null && resizeDirection.value) {
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const event = props.events.find(ev => ev.id === resizingEventId.value)
		if (!event) return

		if (resizeDirection.value === 'top') {
			const newStartRow = slotIndex + 1
			if (newStartRow <= event.gridRowEnd) {
				emit('updateEvent', {
					eventId: resizingEventId.value,
					updates: {
						gridRowStart: newStartRow,
						start: dateTimeFromSlotIndex.value(newStartRow - 1)
					}
				})
			}
		} else if (resizeDirection.value === 'bottom') {
			const newEndRow = slotIndex + 1
			if (newEndRow >= event.gridRowStart) {
				emit('updateEvent', {
					eventId: resizingEventId.value,
					updates: {
						gridRowEnd: newEndRow,
						end: dateTimeFromSlotIndex.value(newEndRow)
					}
				})
			}
		}
		return
	}

	// Handle creation
	if (!isCreating.value || creationStart.value === null) return

	creationEnd.value = getSlotIndexFromPosition(e.clientY)

	const startRow = Math.min(creationStart.value, creationEnd.value) + 1
	const endRow = Math.max(creationStart.value, creationEnd.value) + 1

	const hasConflict = props.events.some(ev => {
		if (ev.isBackground) return false
		return !(endRow + 1 <= ev.gridRowStart || startRow - 1 >= ev.gridRowEnd)
	})

	if (hasConflict) return

	creationPreview.value = {
		startRow,
		endRow
	}
}

const handlePointerUp = (): void => {
	stopAutoScroll()

	// Handle drag end
	if (draggingEventId.value !== null && originalEventState.value) {
		const event = props.events.find(ev => ev.id === draggingEventId.value)

		if (event && (dragConflict.value || event.gridRowStart < 1 || event.gridRowEnd > totalGridRows.value)) {
			// Revert to original position
			emit('updateEvent', {
				eventId: draggingEventId.value,
				updates: originalEventState.value
			})
			emit('conflictDetected')
		}

		draggingEventId.value = null
		dragStartSlot.value = null
		dragOffset.value = 0
		dragConflict.value = false
		originalEventState.value = null
		return
	}

	// Handle resize end
	if (resizingEventId.value !== null) {
		resizingEventId.value = null
		resizeStartSlot.value = null
		resizeDirection.value = null
		return
	}

	// Handle creation end
	if (!isCreating.value || creationStart.value === null || creationEnd.value === null || !creationPreview.value) return

	const startTime = slotIndexToTime.value(creationPreview.value.startRow - 1)
	const endTime = slotIndexToTime.value(creationPreview.value.endRow)

	emit('createEvent', {
		startTime,
		endTime,
		gridRowStart: creationPreview.value.startRow,
		gridRowEnd: creationPreview.value.endRow
	})

	isCreating.value = false
	creationStart.value = null
	creationEnd.value = null
	creationPreview.value = null
}

// Cleanup
onUnmounted(() => {
	stopAutoScroll()
})

// Expose focusedEventId for parent
defineExpose({
	focusedEventId
})
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