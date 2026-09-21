<template>
	<VSheet
		:color="backgroundColorComp"
		:style="style"
		:data-task-id="task.id"
		class="base-task-block background-task-block"
		:class="[{ 'past-task': isPast, selected: isSelected }]"
		:tabindex="0"
		role="button"
		:aria-pressed="isSelected"
		:aria-label="accessibleLabel"
		:aria-keyshortcuts="KEY_SHORTCUTS"
		@keydown.space.exact.prevent="handleToggleSelectionKey"
		@keydown.enter.exact="handleToggleSelectionKey"
		@keydown.e.exact="handleEditKey"
		@keydown.delete.exact="handleDeleteKey"
		@keydown.backspace.exact="handleDeleteKey"
		@keydown.esc.exact="handleEscapeKey"
		@keydown.ctrl.d.exact.prevent="handleDuplicateKey"
	>
		<!-- Sideways text with a colour-coded importance icon: legible on screen, meaningless to a
		     screen reader, which cannot tell this apart from a normal block. `role="button"` makes it
		     presentational anyway; the block's whole name is the composed `aria-label` above, the same
		     contract `BaseTaskBlock` keeps for foreground tasks (F78). -->
		<VSheet
			class="background-task-label"
			:color="backgroundColorComp"
			aria-hidden="true"
		>
			{{ task.activity.name }}
			<VIcon
				v-if="!!task.importance"
				class="mb-1 mr-1"
				:icon="task.importance?.icon ?? undefined"
				:color="task.importance?.color"
				:size="20"
				style="transform: rotate(-90deg)"
			></VIcon>
		</VSheet>
	</VSheet>
</template>

<script setup lang="ts">
	import { computed, inject } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useColor } from '@/_common/composable/general/useColor.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useTaskBlockKeyboard } from '@/core/dayPlanner/composable/useTaskBlockKeyboard.ts'

	const { task, isPast, marginLeft } = defineProps<{
		task: IBasePlannerTask<IBasePlannerTaskRequest>
		isPast?: boolean
		marginLeft?: string
	}>()

	// The foreground block's key map minus the arrow moves, which act on the selection from the
	// document-level handler and are listed there.
	const KEY_SHORTCUTS = 'Space Enter E Delete Control+D'

	const store = inject(PLANNER_STORE_KEY)!
	const { getBgColor } = useColor()
	const { t } = useI18n()

	// The pointer path selects a background block like any other (`usePlannerPointerInteractions`
	// hit-tests `.base-task-block`); this is the keyboard half it never had — without a `tabindex`
	// Tab skipped it and Escape, which needs focus inside the grid, could not clear it.
	const isSelected = computed(() => store.selectedTaskIds.has(task.id))
	const { handleToggleSelectionKey, handleEditKey, handleDeleteKey, handleEscapeKey, handleDuplicateKey } =
		useTaskBlockKeyboard(store, () => task.id, isSelected)

	const backgroundColorComp = computed(() => getBgColor(task.activity?.role?.color) || '#4287f5')

	const accessibleLabel = computed(() => {
		const parts = [
			t('planner.a11y.backgroundTaskLabel', {
				name: task.activity.name,
				start: Time.getString(task.startTime),
				end: Time.getString(task.endTime),
			}),
		]
		if (task.importance?.text) parts.push(t('planner.a11y.importancePart', { importance: task.importance.text }))
		if (task.location) parts.push(t('planner.a11y.locationPart', { location: task.location }))
		return parts.join(', ')
	})

	const style = computed(() => {
		const span = Math.max(1, (task.gridRowEnd || 1) - (task.gridRowStart || 1))
		return {
			marginLeft: marginLeft ?? `${task.isDuringBackgroundTask ? 36 : 0}px`,
			gridRow: `${task.gridRowStart} / span ${span}`,
		}
	})
</script>

<style scoped>
	.base-task-block {
		box-sizing: border-box !important;
	}

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

	.background-task-block:focus {
		outline: none;
	}

	.background-task-block:focus-visible {
		outline: 3px solid rgb(var(--v-theme-secondary));
		outline-offset: -3px;
		z-index: 12;
	}

	.background-task-block.selected {
		z-index: 11;
		border: 2px solid #eee;
	}

	.background-task-block::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: repeating-linear-gradient(0deg, transparent 10px, rgba(255, 255, 255, 0.4) 14px);
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
</style>
