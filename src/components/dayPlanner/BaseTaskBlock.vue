<template>
	<BackgroundTaskBlock
		v-if="task.isBackground && !isOutOfView"
		:task
		:isPast
		:marginLeft
	/>

	<VSheet
		v-else-if="!isOutOfView"
		color="primary-container"
		:style="style"
		class="base-task-block task-block"
		:class="[...blockClasses]"
		:tabindex="0"
		:data-task-id="task.id"
		@keydown.enter="handleEnterKey"
		@keydown.e="handleEKey"
		@keydown.delete="handleDeleteKey"
		@keydown.backspace="handleDeleteKey"
		@keydown.esc="handleEscapeKey"
		@keydown.ctrl.d.prevent="handleDuplicateKey"
	>
		<div
			class="task-color-accent"
			:style="{ backgroundColor: backgroundColorComp }"
		/>
		<div
			class="resize-handle resize-handle-top"
			@click.stop
			@pointerdown="emit('resizeStart', { taskId: task.id, direction: 'top', pointerEvent: $event })"
		/>
		<div class="task-content pl-5 pr-3 pointer-events-none flex-fill d-flex align-center">
			<div class="task-content-main w-100 d-flex justify-space-between align-center">
				<div class="d-flex ga-4 align-center flex-wrap">
					<slot name="prepend"></slot>
					<div
						v-if="!!task.importance"
						class="d-flex"
						:class="{ 'flex-column align-center': !task.isTaskOneRow }"
					>
						<VIcon
							:icon="task.importance?.icon ?? undefined"
							:color="task.importance?.color"
							:size="task.isTaskOneRow ? 20 : 24"
						></VIcon>
						<!--						<span class="text-caption">-->
						<!--							{{ task.importance?.text }}-->
						<!--						</span>-->
					</div>
					<div class="task-header-main">
						<div class="task-title">{{ task.activity.name }}</div>

						<!-- Slot for time display - different for template vs regular -->
						<slot
							name="time"
							:task="task"
						>
							<div
								v-if="!task.isTaskOneRow"
								class="task-time"
							>
								{{ formattedTime }}
							</div>
						</slot>
					</div>
					<div
						class="d-flex align-center ga-2"
						:class="{ 'flex-column align-start': !task.isTaskOneRow }"
					>
						<ChipWithIcon
							class="task-chip"
							size="x-small"
							variant="tonal"
							:icon="task.activity.role.icon ?? undefined"
							:color="task.activity.role.color ?? 'white'"
						>
							{{ task.activity.role.name }}
						</ChipWithIcon>
						<div
							v-if="task.activity.category"
							class="task-category"
						>
							<VIcon
								v-if="task.activity.category.icon"
								:icon="task.activity.category.icon ?? undefined"
							></VIcon>
							{{ task.activity.category.name }}
						</div>
					</div>

					<div
						v-if="task.location"
						class="text-medium-emphasis text-body-2"
					>
						<VIcon
							class="mr-1"
							size="16"
							icon="location-dot"
							style="margin-bottom: 2px"
						></VIcon>
						<span>{{ task.location }}</span>
					</div>
					<span
						v-if="task.notes"
						class="text-caption"
					>
						<VIcon
							icon="far fa-note-sticky"
							class="mr-1"
							:size="task.isTaskOneRow ? 16 : 18"
							style="margin-bottom: 3px"
						></VIcon>
						{{ task.notes }}
					</span>
				</div>
				<div>
					<slot name="checkbox"></slot>
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

<script
	setup
	lang="ts"
	generic="
		TTask extends IBasePlannerTask<TTaskRequest>,
		TTaskRequest extends IBasePlannerTaskRequest,
		TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>
	"
>
	import { computed, inject } from 'vue'
	import type { IBasePlannerTask } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
	import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import ChipWithIcon from '@/components/general/ChipWithIcon.vue'
	import { useColor } from '@/utils/colorPalette.ts'
	import BackgroundTaskBlock from '@/components/dayPlanner/BackgroundTaskBlock.vue'
	import { useTaskBlockKeyboard } from '@/composables/dayPlanner/useTaskBlockKeyboard.ts'

	const { task, isPast, marginLeft } = defineProps<{
		task: TTask
		isPast?: boolean
		marginLeft?: string
	}>()

	const emit = defineEmits<{
		(e: 'resizeStart', payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void
	}>()

	const store = inject<TStore>('plannerStore')!
	const { getBgColor } = useColor()

	const isSelected = computed(() => store.selectedTaskIds.has(task.id))
	const isDragging = computed(() => store.draggingTaskId === task.id)
	const isResizing = computed(() => store.resizingTaskId === task.id)
	const isConflict = computed(
		() =>
			(store.dragConflict && store.draggingTaskId === task.id) ||
			(store.clipboardConflict && store.clipboardPreviewTaskIds.has(task.id)) ||
			(store.arrowMoveConflict && store.selectedTaskIds.has(task.id)),
	)
	const isAnyTaskBeingManipulated = computed(() => store.isDraggingAny || store.isResizingAny)

	const backgroundColorComp = computed(() => {
		return getBgColor(task.activity?.role?.color) || '#4287f5'
	})

	const isOutOfView = computed(() => task.gridRowStart === 1 && task.gridRowEnd === 1)

	const style = computed(() => {
		const span = Math.max(1, (task.gridRowEnd || 1) - (task.gridRowStart || 1))
		return {
			marginLeft: marginLeft ?? `${task.isDuringBackgroundTask ? 36 : 0}px`,
			gridRow: `${task.gridRowStart} / span ${span}`,
		}
	})

	const formattedTime = computed(() => {
		// Default time formatting (can be overridden via slot)
		return `${Time.getString(task.startTime)} - ${Time.getString(task.endTime)}`
	})

	const blockClasses = computed(() => [
		{
			dragging: isDragging.value,
			resizing: isResizing.value,
			'past-task': isPast,
			selected: isSelected.value,
			conflict: isConflict.value,
			'no-hover': isAnyTaskBeingManipulated.value,
		},
	])

	const { handleEnterKey, handleEKey, handleDeleteKey, handleEscapeKey, handleDuplicateKey } = useTaskBlockKeyboard(
		store,
		isSelected,
	)
</script>

<style scoped>
	.base-task-block {
		box-sizing: border-box !important;
		border: 2px hidden transparent;
	}

	.task-color-accent {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 8px;
		z-index: 1;
		pointer-events: none;
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
		overflow: clip;
		z-index: 10;
		user-select: none;
	}

	.task-content-main {
		position: sticky;
		top: 0;
	}

	.task-block:focus {
		outline: none;
	}

	.base-task-block.selected {
		z-index: 11;
		border: 2px solid #eee;
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
		cursor: not-allowed !important;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(244, 67, 54, 0.4);
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

	.task-header-main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.task-title {
		font-weight: 500;
		font-size: 16px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.2;
	}

	.task-time {
		font-size: 0.8rem;
		opacity: 0.9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.task-chip {
		flex-shrink: 0;
	}

	.task-category {
		font-size: 0.7rem;
		padding: 2px 6px;
		border-radius: 12px;
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
