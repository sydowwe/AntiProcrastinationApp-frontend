<template>
<VSheet
	v-if="task.isBackground"
	:color="backgroundColorComp"
	:style="style(task)"
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
	:style="style(task)"
	:class="['base-task-block','task-block', ...blockClasses]"
	:tabindex="0"
	:data-task-id="task.id"
	@keydown.enter="handleEnterKey"
	@keydown.e="handleEKey"
	@keydown.delete="handleDeleteKey"
	@keydown.backspace="handleDeleteKey"
	@keydown.esc="handleEscapeKey"
>
	<div
		class="resize-handle resize-handle-top"
		@click.stop
		@pointerdown="emit('resizeStart', { taskId: task.id, direction: 'top', pointerEvent: $event })"
	/>

	<div class="task-content">
		<div class="task-content-main">
			<div class="d-flex flex-column flex-wrap">
				<div class="task-header">
					<slot name="checkbox"></slot>
					<div v-if="task.importance?.importance !== 777" class="d-flex flex-column align-center">
						<VIcon :icon="task.importance?.icon ?? undefined" :color="task.importance?.color" size="24"></VIcon>
						<span class="text-caption">
				{{ task.importance?.text }}
				</span>
					</div>
					<div class="task-header-main">
						<div class="task-title">{{ task.activity.name }}</div>

						<!-- Slot for time display - different for template vs regular -->
						<slot name="time" :task="task">
							<div class="task-time">{{ formattedTime }}</div>
						</slot>
					</div>
					<ChipWithIcon
						v-if="task.activity.role"
						class="task-chip"
						size="x-small"
						variant="flat"
						:icon="task.activity.role.icon ?? undefined"
						:color="task.activity.role.color ?? 'white'"
					>
						{{ task.activity.role.name }}
					</ChipWithIcon>
				</div>

				<!-- Slot for additional chips/badges - different for template vs regular -->
				<div class="d-flex ga-3 mt-1">
					<div class="d-flex ga-1 align-center text-body-2">
						<VIcon class="my-1" icon="location-dot"></VIcon>
						<span class="mr-1">{{ task.location }}</span>
					</div>
					<div class="task-badges">
						<div v-if="task.activity.category"
						     class="task-category">
							<VIcon v-if="task.activity.category.icon" :icon="task.activity.category.icon ?? undefined"></VIcon>
							{{ task.activity.category.name }}
						</div>
						<slot name="badges"></slot>
					</div>
				</div>
			</div>
			<div class="pt-1">
				<span v-if="task.notes" class="text-caption">
				<VIcon icon="far fa-note-sticky"></VIcon>
				{{ task.notes }}
				</span>
			</div>
		</div>
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
import {Time} from '@/dtos/dto/Time.ts';
import ChipWithIcon from '@/components/general/ChipWithIcon.vue';

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

const style = computed(() => (task: TTask) => {
	const span = Math.max(1, (task.gridRowEnd || 1) - (task.gridRowStart || 1))
	return {
		marginLeft: marginLeft ?? `${task.isDuringBackgroundTask ? 36 : 0}px`,
		gridRow: `${task.gridRowStart} / span ${span}`,
		borderLeft: task.importance?.importance === 777 || (task.isBackground && task.importance?.importance === 666) ? '' : `4px solid ${task.importance?.color ?? 'transparent'}`,
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
	border-left-width: 3px;
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
	pointer-events: none;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 4px;
	overflow: hidden;
}

.task-content-main {
	padding: 8px 12px 4px;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	gap: 16px;
}

.task-header {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 0;
}

.task-header-main {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
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
	font-size: 0.8rem;
	opacity: 0.9;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.task-badges {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	padding: 6px;
}

.task-chip {
	flex-shrink: 0;
}

.task-category {
	font-size: 0.7rem;
	padding: 2px 6px;
	border-radius: 4px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.4);
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
	pointer-events: none;
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
