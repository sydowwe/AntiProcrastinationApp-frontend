<!-- EventsColumn.vue - Generic, works with any store -->
<template>
<div
	ref="eventsColumnRef"
	class="events-column"
	:style="{ gridTemplateRows: `repeat(${plannerStore.totalGridRows}, ${SLOT_HEIGHT}px)` }"
	@pointerdown="handlePointerDown"
	@pointermove="handlePointerMove"
>
	<!-- Time Slots with hover effect -->
	<div
		v-for="(slot, index) in plannerStore.timeSlots"
		:key="index"
		:class="['event-slot', { 'hoverable': !creationPreview && !plannerStore.isDraggingAny }]"
		:data-slot-index="index"
	/>

	<!-- Midnight divider -->
	<div
		class="midnight-divider-events"
		:style="{ top: `${plannerStore.timeToSlotIndex('00:00') * SLOT_HEIGHT}px` }"
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

	<!-- Event Blocks - use slot for flexibility -->
	<slot name="event-block" v-for="event in plannerStore.visibleEvents" :key="event.id" :event="event" :onResizeStart="handleResizeStart">
		<!-- Default: use EventBlock for regular planner -->
		<EventBlock
			:event="event"
			@resizeStart="handleResizeStart"
		/>
	</slot>
</div>
</template>

<script setup lang="ts"
        generic="TEvent extends IBasePlannerTask, TStore extends Record<string, any>">
import {computed, onMounted, ref} from 'vue'
import {CreationPreviewType, SLOT_HEIGHT} from '@/types/DayPlannerTypes'
import EventBlock from './EventBlock.vue'
import CreationPreview from './CreationPreview.vue'
import {useCurrentTimeIndicator} from '@/components/dayPlanner/useCurrentTimeIndicator.ts';
import {useAutoScroll} from '@/composables/general/useAutoScroll.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';

// Props - store and time conversion functions
const props = defineProps<{
	plannerStore: TStore
	slotIndexToTimeValue: (index: number) => Date | string
}>()

const eventsColumnRef = ref<HTMLElement | undefined>(undefined)
const calendarGrid = computed(() => eventsColumnRef.value?.parentElement as HTMLElement)
const {handleAutoScroll, stopAutoScroll} = useAutoScroll(calendarGrid)
const {isVisible, gridRowStyle} = useCurrentTimeIndicator()

// Creation state
const creationPreview = ref<CreationPreviewType | undefined>(undefined)

// Drag state (local to EventsColumn - not needed in EventBlock)
const originalEventState = ref<TEvent | null>(null)
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
	const slotHeight = rect.height / props.plannerStore.totalGridRows

	return Math.max(0, Math.min(props.plannerStore.totalGridRows - 1, Math.floor(relativeY / slotHeight)))
}

function checkEventConflictByRow(newStartRow: number, newEndRow: number, eventId?: string | number): boolean {
	return props.plannerStore.events.some((event: TEvent) => {
		if (event.id === eventId || event.isBackground) return false
		return !(newEndRow < (event.gridRowStart || 0) || newStartRow > (event.gridRowEnd || 0))
	})
}

function handleResizeStart(payload: { eventId: string | number; direction: 'top' | 'bottom'; $event: PointerEvent }): void {
	const event = props.plannerStore.events.find((ev: TEvent) => ev.id === payload.eventId)
	if (!event || !event.gridRowStart) return

	props.plannerStore.resizingEventId = payload.eventId
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
		const eventIdStr = eventBlock.dataset.eventId
		if (!eventIdStr) return

		// Try to parse as number, otherwise use as string
		const eventId: string | number = isNaN(Number(eventIdStr)) ? eventIdStr : Number(eventIdStr)
		const event = props.plannerStore.events.find((ev: TEvent) => ev.id === eventId)
		if (!event || event.isBackground || !event.gridRowStart) return

		props.plannerStore.draggingEventId = eventId
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
	if (props.plannerStore.draggingEventId !== null && dragStartSlot.value !== null && originalEventState.value) {
		handleAutoScroll(e.clientY)

		const currentSlot = getSlotIndexFromPosition(e.clientY)
		const event = props.plannerStore.events.find((ev: TEvent) => ev.id === props.plannerStore.draggingEventId)
		if (!event || !originalEventState.value.gridRowStart || !originalEventState.value.gridRowEnd) return

		const eventDuration = originalEventState.value.gridRowEnd - originalEventState.value.gridRowStart
		const newStartRow = currentSlot - dragOffset.value + 1
		const newEndRow = newStartRow + eventDuration

		const fitsInView = newStartRow >= 1 && newEndRow <= props.plannerStore.totalGridRows
		const hasConflict = checkEventConflictByRow(newStartRow, newEndRow, props.plannerStore.draggingEventId)

		props.plannerStore.dragConflict = hasConflict || !fitsInView

		const timeValue: any = {
			gridRowStart: newStartRow,
			gridRowEnd: newEndRow
		}

		// Add time values using the conversion function
		const startTime = props.slotIndexToTimeValue(newStartRow - 1)
		const endTime = props.slotIndexToTimeValue(newEndRow)

		if (startTime instanceof Date) {
			timeValue.start = startTime
			timeValue.end = endTime
		} else {
			timeValue.startTime = startTime
			timeValue.endTime = endTime
		}

		emit('updatedTaskSpan', {eventId: props.plannerStore.draggingEventId, updates: timeValue})
		return
	}

	// Handle resizing
	if (props.plannerStore.resizingEventId !== null && resizeDirection.value) {
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const event = props.plannerStore.events.find((ev: TEvent) => ev.id === props.plannerStore.resizingEventId)
		if (!event || !event.gridRowStart || !event.gridRowEnd) return

		if (resizeDirection.value === 'top') {
			const newStartRow = slotIndex + 1
			if (newStartRow <= event.gridRowEnd && !checkEventConflictByRow(newStartRow, event.gridRowEnd, props.plannerStore.resizingEventId)) {
				const timeValue: any = {
					gridRowStart: newStartRow
				}
				const startTime = props.slotIndexToTimeValue(newStartRow - 1)
				if (startTime instanceof Date) {
					timeValue.start = startTime
				} else {
					timeValue.startTime = startTime
				}
				emit('updatedTaskSpan', {eventId: props.plannerStore.resizingEventId, updates: timeValue})
			}
		} else if (resizeDirection.value === 'bottom') {
			const newEndRow = slotIndex + 1
			if (newEndRow >= event.gridRowStart && !checkEventConflictByRow(event.gridRowStart, newEndRow, props.plannerStore.resizingEventId)) {
				const timeValue: any = {
					gridRowEnd: newEndRow
				}
				const endTime = props.slotIndexToTimeValue(newEndRow)
				if (endTime instanceof Date) {
					timeValue.end = endTime
				} else {
					timeValue.endTime = endTime
				}
				emit('updatedTaskSpan', {eventId: props.plannerStore.resizingEventId, updates: timeValue})
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
	if (props.plannerStore.draggingEventId !== null && originalEventState.value) {
		const event = props.plannerStore.events.find((ev: TEvent) => ev.id === props.plannerStore.draggingEventId)

		if (event && (props.plannerStore.dragConflict || !event.gridRowStart || !event.gridRowEnd || event.gridRowStart < 1 || event.gridRowEnd > props.plannerStore.totalGridRows)) {
			// Revert to original position
			emit('updatedTaskSpan', {eventId: props.plannerStore.draggingEventId, updates: originalEventState.value})
			props.plannerStore.conflictSnackbar = true
		}

		// Only remove focus if the event actually moved
		const didMove = event && originalEventState.value.gridRowStart && originalEventState.value.gridRowEnd &&
			(event.gridRowStart !== originalEventState.value.gridRowStart || event.gridRowEnd !== originalEventState.value.gridRowEnd)
		if (didMove) {
			props.plannerStore.handleFocusEvent(null);
			(document.activeElement as HTMLElement).blur()
		}

		props.plannerStore.draggingEventId = null
		dragStartSlot.value = null
		dragOffset.value = 0
		props.plannerStore.dragConflict = false
		originalEventState.value = null
		return
	}

	// Handle resize end
	if (props.plannerStore.resizingEventId !== null) {
		props.plannerStore.resizingEventId = null
		resizeStartSlot.value = null
		resizeDirection.value = null
		return
	}

	// Handle creation end
	if (!creationPreview.value) return

	const startTime = props.slotIndexToTimeValue(creationPreview.value.startRow - 1)
	const endTime = props.slotIndexToTimeValue(creationPreview.value.endRow)

	props.plannerStore.openCreateDialogPrefilled(startTime, endTime)

	creationPreview.value = undefined
}

onMounted(() => {
	document.addEventListener('pointerup', handlePointerUp)
})

const emit = defineEmits<{
	(e: 'updatedTaskSpan', payload: { eventId: number, updates: Partial<TEvent> }): void
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