<template>
<VSheet
	v-if="event.isBackground"
	:color="backgroundColorComp"
	:style="style"
	:data-event-id="event.id"
	:class="['background-event-block', { 'past-event': isPast }]"
>
	<VSheet class="background-event-label" :color="backgroundColorComp">
		{{ event.activity.name }}
	</VSheet>
</VSheet>

<VSheet
	v-else
	:color="`${backgroundColorComp}E0`"
	:style
	:class="['event-block', ...blockClasses]"
	:data-event-id="event.id"
	:tabindex="0"
	@click="handleClick"
	@keydown.enter="handleEnterKey"
	@keydown.e="handleEKey"
	@keydown.delete="handleDeleteKey"
	@keydown.backspace="handleDeleteKey"
	@keydown.space="handleSpaceKey"
	@keydown.esc="handleEscapeKey"
	@focus="emit('focusEvent', event.id)"
	@blur="emit('focusEvent', null)"
>
	<slot name="checkbox"></slot>
	<div
		class="resize-handle resize-handle-top"
		:data-event-id="event.id"
		@click.stop
		@pointerdown="emit('resizeStart', { eventId: event.id, direction: 'top', $event })"
	/>

	<div class="event-content">
		<div class="event-title">{{ event.activity.name }}</div>

		<!-- Slot for time display - different for template vs regular -->
		<slot name="time" :event="event">
			<div class="event-time">{{ formattedTime }}</div>
		</slot>

		<!-- Slot for additional chips/badges - different for template vs regular -->
		<slot name="badges" :event="event">
			<!-- Default: show category if exists -->
			<VChip
				v-if="event.activity.category"
				size="x-small"
				variant="flat"
				:prependIcon="event.activity.category.icon ?? undefined"
				:color="event.activity.category.color ?? 'white'"
				class="event-chip"
			>
				{{ event.activity.category.name }}
			</VChip>
		</slot>
	</div>

	<div
		class="resize-handle resize-handle-bottom"
		:data-event-id="event.id"
		@click.stop
		@pointerdown="$emit('resizeStart', { eventId: event.id, direction: 'bottom', $event })"
	/>
</VSheet>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {computed, inject, ref} from 'vue'
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {Time} from '@/utils/Time.ts';

const {event, backgroundColor, isPast} = defineProps<{
	event: TTask
	backgroundColor?: string
	isPast?: boolean
}>()

// Inject the store from parent DayPlanner component
const store = inject<TStore>('plannerStore')!

// Computed states
const isSelected = computed(() => store.selectedEventIds.has(event.id))
const isFocused = computed(() => store.focusedEventId === event.id)
const isDragging = computed(() => store.draggingEventId === event.id)
const isResizing = computed(() => store.resizingEventId === event.id)
const isConflict = computed(() => store.dragConflict && store.draggingEventId === event.id)
const isAnyEventBeingManipulated = computed(() => store.isDraggingAny || store.isResizingAny)

const backgroundColorComp = computed(() => {
	return backgroundColor || event.activity?.role?.color || '#4287f5'
})

const style = computed(() => {
	const span = Math.max(1, (event.gridRowEnd || 1) - (event.gridRowStart || 1))
	return {
		marginRight: `${event.isDuringBackgroundEvent ? 35 : 0}px`,
		gridRow: `${event.gridRowStart} / span ${span}`
	}
})

const formattedTime = computed(() => {
	// Default time formatting (can be overridden via slot)
	return `${Time.getString(event.startTime)} - ${Time.getString(event.endTime)}`
})

const blockClasses = computed(() => [
	{
		'dragging': isDragging.value,
		'resizing': isResizing.value,
		'past-event': isPast,
		'focused': isFocused.value,
		'selected': isSelected.value,
		'conflict': isConflict.value,
		'no-hover': isAnyEventBeingManipulated.value,
		'optional-task': event.isOptional,
	}
])

const emit = defineEmits<{
	(e: 'resizeStart', payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void
	(e: 'focusEvent', id: number | null): void
	(e: 'openEditDialog'): void
	(e: 'toggleSelection', id: number): void
	(e: 'toggleIsDone', id: number): void
	(e: 'deleteSelected'): void
	(e: 'toggleIsDoneSelected'): void
}>()

// Click handling with double-click detection
const clickTimer = ref<number | null>(null)
const DOUBLE_CLICK_DELAY = 250 // ms

function handleClick(e: MouseEvent): void {
	// Don't handle clicks if we're currently dragging or resizing
	if (store.isDraggingAny || store.isResizingAny) return

	// Don't handle clicks on resize handles (they're handled separately)
	if ((e.target as HTMLElement).classList.contains('resize-handle')) return

	if (clickTimer.value === null) {
		// First click - start timer for double-click detection
		clickTimer.value = window.setTimeout(() => {
			// Single click confirmed - toggle selection
			emit('toggleSelection', event.id)
			clickTimer.value = null
		}, DOUBLE_CLICK_DELAY)
	} else {
		// Second click within delay - it's a double click
		clearTimeout(clickTimer.value)
		clickTimer.value = null
		emit('openEditDialog')
	}
}

// Keyboard handlers
function handleEnterKey(e: KeyboardEvent): void {
	e.preventDefault()
	// Only open edit if single event is selected (this event is focused/selected)
	if (isSelected.value && store.selectedEventIds.size === 1) {
		emit('openEditDialog')
	}
}

function handleEKey(e: KeyboardEvent): void {
	e.preventDefault()
	// Only open edit if single event is selected
	if (isSelected.value && store.selectedEventIds.size === 1) {
		emit('openEditDialog')
	}
}

function handleDeleteKey(e: KeyboardEvent): void {
	e.preventDefault()
	// Emit delete event for all selected events
	emit('deleteSelected')
}

function handleSpaceKey(e: KeyboardEvent): void {
	e.preventDefault()
	// Emit toggle isDone for all selected events
	emit('toggleIsDoneSelected')
}

function handleEscapeKey(e: KeyboardEvent): void {
	e.preventDefault()
	store.clearSelection()
	;(e.target as HTMLElement).blur()
}
</script>

<style scoped>
/* Event Block Styles */
.event-block {
	position: absolute;
	top: 2px;
	left: 0;
	right: 0;
	bottom: 0;
	cursor: move;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	display: flex;
	flex-direction: row;
	overflow: hidden;
	z-index: 10;
	user-select: none;
}


.event-block:focus {
	outline: none;
}

.event-block.focused {
	transform: scalex(1.015);
	right: 0.75%;
	z-index: 11;
	border: 3px solid #ffffff;
	box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
}

.event-block.selected {
	border: 3px solid rgb(var(--v-theme-primary));
	box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3);
	z-index: 11;
}

.event-block.dragging {
	z-index: 100;
	filter: brightness(0.9);
	cursor: grabbing !important;
}

.event-block.conflict {
	opacity: 0.7 !important;
	background: rgba(244, 67, 54, 0.7) !important;
	animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.02);
	}
}

.event-block:not(.no-hover):hover {
	transform: scalex(1.015);
	right: 0.75%;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 11;
	cursor: grab;
}

.event-block.past-event {
	filter: grayscale(30%) brightness(0.9);
}

.event-block.past-event:hover {
	filter: grayscale(20%) brightness(0.95);
}

.event-block.optional-task {
	border: 2px dashed rgba(255, 255, 255, 0.5);
}

.event-content {
	flex: 1;
	padding: 8px 12px;
	pointer-events: none;
	cursor: pointer;
	min-height: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-content: start;
	flex-wrap: wrap;
	row-gap: 3px;
	column-gap: 20px;
}

.event-title {
	font-weight: 500;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
	opacity: 1;
}

.event-time {
	font-size: 11px;
	opacity: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-chip {
	margin-top: 2px;
}

.resize-handle {
	position: absolute;
	width: 100%;
	height: 8px;
	background: rgba(0, 0, 0, 0.1);
	cursor: ns-resize;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease;
	flex-shrink: 0;
}

.resize-handle-bottom {
	bottom: 0;
}

.resize-handle:hover {
	background: rgba(0, 0, 0, 0.3);
}

/* Background Event Styles */
.background-event-block {
	position: absolute;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	right: 0;
	top: 2px;
	bottom: 0;
	z-index: 5;
}

.background-event-block::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: repeating-linear-gradient(
		135deg,
		transparent 10px,
		transparent 10px,
		rgba(255, 255, 255, 0.5) 20px,
		rgba(255, 255, 255, 0.5) 20px
	);
	pointer-events: none;
	z-index: 1;
	opacity: 0.9;
}

.background-event-label {
	color: white;
	position: sticky;
	z-index: 20;
	opacity: 100%;
	top: 46%;
	padding: 7px 7px;
	writing-mode: sideways-lr;
	font-size: 15px;
	font-weight: 600;
}

/* Animation for new events */
@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateX(-10px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

.event-block {
	animation: slideIn 0.3s ease-out;
}
</style>
