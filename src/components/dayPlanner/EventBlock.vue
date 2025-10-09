<template>
<VSheet
	v-if="event.isBackground"
	:color="event.color"
	:style="style"
	:data-event-id="event.id"
	:class="['background-event-block', { 'past-event': isPast }]"
>
	<VSheet class="background-event-label" :color="event.color">
		{{ event.activity.name }}
	</VSheet>
</VSheet>

<VSheet
	v-else
	:color="`${event.color}E0`"
	:style
	:class="['event-block', ...blockClasses]"
	:data-event-id="event.id"
	:tabindex="0"
	@keydown.enter="store.openEditDialog"
	@keydown.esc="e=>e.target.blur()"
	@focus="store.handleFocusEvent(event.id)"
	@blur="store.handleFocusEvent(null)"
>
	<div
		class="resize-handle resize-handle-top"
		:data-event-id="event.id"
		@click.stop
		@pointerdown="emit('resizeStart', { eventId: event.id, direction: 'top', $event })"
	/>

	<div class="event-content">
		<div class="event-title">{{ event.activity.name }}</div>
		<div class="event-time">{{ formattedTime }}</div>
		<VChip
			v-if="event.activity.category"
			size="x-small"
			variant="flat"
			:prependIcon="event.activity.category.icon ?? undefined"
			:color="event.activity.category.color ?? 'white'"
			class="event-category-chip"
		>
			{{ event.activity.category.name }}
		</VChip>
	</div>

	<div
		class="resize-handle resize-handle-bottom"
		:data-event-id="event.id"
		@click.stop
		@pointerdown="$emit('resizeStart', { eventId: event.id, direction: 'bottom', $event })"
	/>
</VSheet>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useMoment} from '@/scripts/momentHelper.ts';
import {useDayPlannerStore} from '@/stores/dayPlannerStore.ts';
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts';
import type {PlannerTask} from '@/classes/PlannerTask.ts';

const {formatToTime24H} = useMoment()
const {currentTime} = useCurrentTime()
const store = useDayPlannerStore()

const {event} = defineProps<{
	event: PlannerTask
}>()

// Computed states based on store
const isFocused = computed(() => store.focusedEventId === event.id)
const isDragging = computed(() => store.draggingEventId === event.id)
const isResizing = computed(() => store.resizingEventId === event.id)
const isConflict = computed(() => store.dragConflict && store.draggingEventId === event.id)
const isPast = computed(() => event.end < currentTime.value)
const isAnyEventBeingManipulated = computed(() => store.isDraggingAny || store.isResizingAny)

const style = computed(() => {
	const span = Math.max(1, (event.gridRowEnd || 1) - (event.gridRowStart || 1) + 1)
	return {
		marginRight: `${event.isDuringBackgroundEvent ? 35 : 0}px`,
		gridRow: `${event.gridRowStart} / span ${span}`
	}
})

const formattedTime = computed(() => {
	return `${formatToTime24H(event.start)} - ${formatToTime24H(event.end)}`
})

const blockClasses = computed(() => [
	{
		'dragging': isDragging.value,
		'resizing': isResizing.value,
		'past-event': isPast.value,
		'focused': isFocused.value,
		'conflict': isConflict.value,
		'no-hover': isAnyEventBeingManipulated.value
	}
])

const emit = defineEmits<{
	(e: 'resizeStart', payload: { eventId: number; direction: 'top' | 'bottom'; $event: PointerEvent }): void
}>()
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
	flex-direction: column;
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

.event-content {
	flex: 1;
	padding: 7px 15px;
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

.event-category-chip {
	margin-top: 2px;
}

.resize-handle {
	position: absolute;
	width: 100%;
	height: 10px;
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