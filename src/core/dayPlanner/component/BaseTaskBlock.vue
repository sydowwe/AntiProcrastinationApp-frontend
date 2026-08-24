<template>
	<BackgroundTaskBlock
		v-if="task.isBackground && !isOutOfView"
		v-bind="$attrs"
		:task
		:isPast
		:marginLeft
	/>

	<VSheet
		v-else-if="!isOutOfView"
		v-bind="$attrs"
		color="primary-container"
		:style="style"
		class="base-task-block task-block"
		:class="[...blockClasses]"
		:tabindex="0"
		:data-task-id="task.id"
		role="button"
		:aria-pressed="isSelected"
		:aria-label="accessibleLabel"
		:aria-keyshortcuts="allKeyShortcuts"
		@keydown.space.exact.prevent="handleToggleSelectionKey"
		@keydown.enter.exact="handleToggleSelectionKey"
		@keydown.e.exact="handleEditKey"
		@keydown.delete.exact="handleDeleteKey"
		@keydown.backspace.exact="handleDeleteKey"
		@keydown.esc.exact="handleEscapeKey"
		@keydown.ctrl.d.exact.prevent="handleDuplicateKey"
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

<script setup lang="ts" generic="TTask extends AnyPlannerTask">
	import { computed, inject } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { AnyPlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import BackgroundTaskBlock from '@/core/dayPlanner/component/BackgroundTaskBlock.vue'
	import { useTaskBlockKeyboard } from '@/core/dayPlanner/composable/useTaskBlockKeyboard.ts'

	const {
		task,
		isPast,
		marginLeft,
		extraLabelParts = [],
		extraKeyShortcuts,
	} = defineProps<{
		task: TTask
		isPast?: boolean
		marginLeft?: string
		/**
		 * Localized descriptors only the concrete block knows about — the normal planner's status,
		 * for instance. They are appended to the accessible name because `role="button"` makes the
		 * block's contents presentational: nothing rendered inside it reaches a screen reader.
		 */
		extraLabelParts?: string[]
		/** Extra `aria-keyshortcuts` entries for keys the concrete block binds itself. */
		extraKeyShortcuts?: string
	}>()

	const emit = defineEmits<{
		(e: 'resizeStart', payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void
	}>()

	/**
	 * The `v-if` / `v-else-if` pair above has no `v-else`, so this component is a *fragment* as far as
	 * Vue is concerned, and fragments drop every fallthrough attribute and listener silently. Three
	 * things had been broken by that and nobody noticed, because none of them fails loudly:
	 * `PlannerTaskBlock`'s `:class="classes"` (so the template-preview hatching never rendered), its
	 * status hotkey, and — until this was found — the accessibility hotkeys added on top of it.
	 *
	 * Opting out of implicit inheritance and binding `$attrs` on each branch makes the pass-through
	 * explicit and survives the fragment. `mergeProps` concatenates listeners, so a `@keydown` bound
	 * by a wrapper runs alongside the ones bound below, not instead of them.
	 */
	defineOptions({ inheritAttrs: false })

	const store = inject(PLANNER_STORE_KEY)!
	const { getBgColor } = useColor()
	const { t } = useI18n()

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

	const { handleToggleSelectionKey, handleEditKey, handleDeleteKey, handleEscapeKey, handleDuplicateKey } =
		useTaskBlockKeyboard(store, () => task.id, isSelected)

	/**
	 * The whole accessible name of the block, assembled here rather than left to the markup.
	 *
	 * `role="button"` gives the element presentational children, so the title, the time, the role
	 * chip, the category, the location and the note icon are all invisible to a screen reader — and
	 * the visible title is truncated with an ellipsis anyway, so reading the DOM text was never the
	 * right answer. Conflict is the one that matters most: on screen it is signalled by nothing but a
	 * red tint and a pulse.
	 */
	const accessibleLabel = computed(() => {
		const parts = [
			t('planner.a11y.taskLabel', {
				name: task.activity.name,
				start: Time.getString(task.startTime),
				end: Time.getString(task.endTime),
			}),
			...extraLabelParts,
		]
		if (task.activity.role?.name) parts.push(t('planner.a11y.rolePart', { role: task.activity.role.name }))
		if (task.activity.category?.name) {
			parts.push(t('planner.a11y.categoryPart', { category: task.activity.category.name }))
		}
		if (task.importance?.text) parts.push(t('planner.a11y.importancePart', { importance: task.importance.text }))
		if (task.location) parts.push(t('planner.a11y.locationPart', { location: task.location }))
		if (task.notes) parts.push(t('planner.a11y.notesPart'))
		// Negative ids are the not-yet-committed tasks of a template preview.
		if (task.id < 0) parts.push(t('planner.a11y.previewPart'))
		if (isConflict.value) parts.push(t('planner.a11y.conflictPart'))
		return parts.join(', ')
	})

	const allKeyShortcuts = computed(() =>
		['Space', 'Enter', 'E', 'Delete', 'Control+D', 'ArrowUp', 'ArrowDown', extraKeyShortcuts]
			.filter(Boolean)
			.join(' '),
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

	/* Mouse and pointer focus stays unstyled, as before; `:focus-visible` only fires for keyboard
	   focus, so this is invisible to mouse users and is the only thing telling a keyboard user where
	   they are. The block clips its content, so the outline is drawn inset. */
	.task-block:focus {
		outline: none;
	}

	.task-block:focus-visible {
		outline: 3px solid rgb(var(--v-theme-secondary));
		outline-offset: -3px;
		z-index: 12;
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
