<template>
<VSheet
	v-if="task.isBackground"
	:color="backgroundColorComp"
	:style="style"
	:data-task-id="task.id"
	:class="['base-task-block','background-task-block', { 'past-task': isPast, 'selected': isSelected }]"
>
	<VSheet class="background-task-label" :color="backgroundColorComp">
		{{ task.activity.name }}
	</VSheet>
</VSheet>

<VSheet
	v-else
	:color="`${backgroundColorComp}E0`"
	:style
	:class="['base-task-block','task-block', ...blockClasses]"
	:tabindex="0"
	:data-task-id="task.id"
	@keydown.enter="handleEnterKey"
	@keydown.e="handleEKey"
	@keydown.delete="handleDeleteKey"
	@keydown.backspace="handleDeleteKey"
	@keydown.esc="handleEscapeKey"
>
	<slot name="checkbox"></slot>
	<div
		class="resize-handle resize-handle-top"
		@click.stop
		@pointerdown="emit('resizeStart', { taskId: task.id, direction: 'top', pointerEvent: $event })"
	/>

	<div class="task-content">
		<div class="task-title">{{ task.activity.name }}</div>

		<!-- Slot for time display - different for template vs regular -->
		<slot name="time" :task="task">
			<div class="task-time">{{ formattedTime }}</div>
		</slot>

		<!-- Slot for additional chips/badges - different for template vs regular -->
		<slot name="badges" :task="task">
			<VChip
				v-if="task.importance"
				size="x-small"
				variant="flat"
				:color="task.importance.color"
				class="task-chip"
			>
				{{ task.importance.text }}
			</VChip>

			<VChip
				v-if="task.isOptional"
				size="x-small"
				variant="outlined"
				class="task-chip"
			>
				Optional
			</VChip>

			<VChip
				v-if="task.location"
				size="x-small"
				variant="flat"
				prependIcon="map-marker"
				class="task-chip"
			>
				{{ task.location }}
			</VChip>

			<!-- Also show category if exists -->
			<VChip
				v-if="task.activity.category"
				size="x-small"
				variant="flat"
				:prependIcon="task.activity.category.icon ?? undefined"
				:color="task.activity.category.color ?? 'white'"
				class="task-chip"
			>
				{{ task.activity.category.name }}
			</VChip>
		</slot>
	</div>

	<div
		class="resize-handle resize-handle-bottom"
		@click.stop
		@pointerdown="emit('resizeStart', { taskId: task.id, direction: 'bottom', pointerEvent: $event })"
	/>
</VSheet>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {computed, inject} from 'vue'
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {Time} from '@/utils/Time.ts';

const {task, backgroundColor, isPast, marginLeft} = defineProps<{
	task: TTask
	backgroundColor?: string
	isPast?: boolean,
	marginLeft?: string
}>()

// Inject the store from parent DayPlanner component
const store = inject<TStore>('plannerStore')!

// Computed states
const isSelected = computed(() => store.selectedTaskIds.has(task.id))
const isDragging = computed(() => store.draggingTaskId === task.id)
const isResizing = computed(() => store.resizingTaskId === task.id)
const isConflict = computed(() => store.dragConflict && store.draggingTaskId === task.id)
const isAnyTaskBeingManipulated = computed(() => store.isDraggingAny || store.isResizingAny)

const backgroundColorComp = computed(() => {
	return backgroundColor || task.activity?.role?.color || '#4287f5'
})

const style = computed(() => {
	const span = Math.max(1, (task.gridRowEnd || 1) - (task.gridRowStart || 1))
	return {
		marginLeft: marginLeft ?? `${task.isDuringBackgroundTask ? 36 : 0}px`,
		gridRow: `${task.gridRowStart} / span ${span}`
	}
})

const formattedTime = computed(() => {
	// Default time formatting (can be overridden via slot)
	return `${Time.getString(task.startTime)} - ${Time.getString(task.endTime)}`
})

const blockClasses = computed(() => [
	{
		'dragging': isDragging.value,
		'resizing': isResizing.value,
		'past-task': isPast,
		'selected': isSelected.value,
		'conflict': isConflict.value,
		'no-hover': isAnyTaskBeingManipulated.value,
		'optional-task': task.isOptional,
	}
])


// Keyboard handlers
function handleEnterKey(e: KeyboardEvent): void {
	e.preventDefault()
	// Only open edit if single task is selected (this task is focused/selected)
	if (isSelected.value && store.selectedTaskIds.size === 1) {
		store.openEditDialog()
	}
}

function handleEKey(e: KeyboardEvent): void {
	e.preventDefault()
	// Only open edit if single task is selected
	if (isSelected.value && store.selectedTaskIds.size === 1) {
		store.openEditDialog()
	}
}

function handleDeleteKey(e: KeyboardEvent): void {
	e.preventDefault()
	store.openDeleteDialog()
}

function handleEscapeKey(e: KeyboardEvent): void {
	e.preventDefault()
	store.clearSelection();
	(e.target as HTMLElement).blur()
}

const emit = defineEmits<{
	(e: 'resizeStart', payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void
}>()
</script>

<style scoped>
.base-task-block {
	box-sizing: border-box !important;
	border: 2px hidden transparent;
}

/* Task Block Styles */
.task-block {
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


.task-block:focus {
	outline: none;
}

.base-task-block.selected {
	z-index: 11;
	border: 2px solid #EEE;
}

.task-block.dragging {
	z-index: 100;
	filter: brightness(0.9);
	cursor: grabbing !important;
}

.task-block.conflict {
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

.task-block:not(.no-hover):hover {
	box-shadow: -6px 12px 12px rgba(0, 0, 0, 0.5);
	z-index: 11;
	cursor: grab;
}

.task-block.past-task {
	filter: grayscale(30%) brightness(0.9);
}

.task-block.past-task:hover {
	filter: grayscale(20%) brightness(0.95);
}

.task-content {
	flex: 1;
	padding: 8px 12px;
	pointer-tasks: none;
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

.task-title {
	font-weight: 500;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
	opacity: 1;
}

.task-time {
	font-size: 11px;
	opacity: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.task-chip {
	margin-top: 2px;
}

.resize-handle {
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

.resize-handle:hover {
	background: rgba(0, 0, 0, 0.3);
}

/* Background Task Styles */
.background-task-block {
	position: absolute;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	left: 0;
	top: 2px;
	bottom: 0;
	z-index: 5;
	width: 36px;
	cursor: pointer;
}

.background-task-block::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: repeating-linear-gradient(
		0deg,
		transparent 10px,
		rgba(255, 255, 255, 0.4) 14px
	);
	pointer-tasks: none;
	z-index: 1;
	opacity: 0.9;
	box-sizing: border-box;
}

.background-task-label {
	color: white;
	position: sticky;
	z-index: 20;
	opacity: 100%;
	top: 46%;
	writing-mode: sideways-lr;
	padding: 8px 4px;
	width: 100%;
	border-radius: 4px;
	border: 2px double rgba(255, 255, 255, 0.5);
	font-size: 0.9rem;
	font-weight: 600;
}

/* Animation for new tasks */
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

.task-block {
	animation: slideIn 0.3s ease-out;
}
</style>
