<!-- TasksColumn.vue -->
<template>
	<div
		ref="tasksColumnRef"
		class="tasks-column"
		role="group"
		:tabindex="-1"
		:aria-label="gridLabel"
		:aria-describedby="gridHelpId"
		:class="{
			'clipboard-mode': store.pendingClipboard !== null,
			'resizing-mode': store.isResizingAny,
		}"
		:style="{
			gridTemplateRows: `repeat(${store.totalGridRows}, ${SLOT_HEIGHT}px)`,
			cursor: store.isResizingAny
				? 'ns-resize'
				: store.isDraggingAny
					? store.dragConflict
						? 'not-allowed'
						: 'grabbing'
					: store.pendingClipboard
						? store.clipboardConflict
							? 'not-allowed'
							: store.pendingClipboard.mode === 'cut'
								? 'move'
								: 'copy'
						: undefined,
		}"
		@pointerdown="handlePointerDown"
		@pointermove="handlePointerMove"
		@pointerleave="removePreviewTasksFromGrid()"
	>
		<!-- Time Slots with hover effect -->
		<div
			v-for="(_, index) in store.timeSlots"
			:key="index"
			class="task-slot"
			:class="[{ hoverable: !localCreationPreview && !store.isDraggingAny }]"
			:data-slot-index="index"
		/>

		<!-- Midnight divider -->
		<div
			v-if="store.isOverMidnight"
			class="midnight-divider-tasks"
			:style="{ top: `${store.timeToSlotIndex(new Time(0, 0)) * SLOT_HEIGHT}px` }"
		/>

		<div
			v-if="isVisible"
			class="current-time-indicator"
			:style="gridRowStyle"
		/>

		<!-- Creation Preview -->
		<CreationPreview
			v-show="localCreationPreview"
			:preview="localCreationPreview"
		/>

		<slot
			v-for="task in store.tasks"
			:key="task.id"
			name="task-block"
			:task="task"
			:onResizeStart="handleResizeStart"
		></slot>

		<!-- The keyboard contract of the grid, read out when focus enters a task block. Kept here
		     rather than on each block so it is announced once, not once per task. -->
		<p
			:id="gridHelpId"
			class="d-sr-only"
		>
			{{ gridHelp }}
		</p>

		<!-- Arrow-key moves are the one keyboard action whose failure is signalled by colour alone
		     (the block turns red and pulses). Nothing else in the grid changes, so without this the
		     move looks as if it worked and is then silently rolled back. -->
		<div
			class="d-sr-only"
			role="status"
			aria-live="polite"
		>
			{{ moveStatusMessage }}
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, inject, nextTick, onMounted, ref, useId, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import CreationPreview from './misc/CreationPreview.vue'
	import { useCurrentTimeIndicator } from '@/core/dayPlanner/composable/useCurrentTimeIndicator.ts'
	import { PLANNER_GRID_KEY, SLOT_HEIGHT } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { usePlannerClipboardPreview } from '@/core/dayPlanner/composable/usePlannerClipboardPreview.ts'
	import { usePlannerPointerInteractions } from '@/core/dayPlanner/composable/usePlannerPointerInteractions.ts'
	import { usePlannerKeyboard } from '@/core/dayPlanner/composable/usePlannerKeyboard.ts'

	const { helpExtra } = defineProps<{
		/** A sentence appended to the grid's keyboard help, for keys only one planner binds. */
		helpExtra?: string
	}>()

	const store = inject(PLANNER_STORE_KEY)!
	const gridElement = inject(PLANNER_GRID_KEY, undefined)
	const { t } = useI18n()

	const tasksColumnRef = ref<HTMLElement | undefined>(undefined)
	// Per-instance, because the split view mounts two grids and an `aria-describedby` pointing at a
	// duplicated id resolves to whichever one the browser saw first.
	const gridHelpId = useId()
	const { isVisible, gridRowStyle } = useCurrentTimeIndicator(store)
	const { currentTime } = useCurrentTime()

	const { previewTaskIds, addPreviewTasksToGrid, removePreviewTasksFromGrid } = usePlannerClipboardPreview(store)
	const { localCreationPreview, handleResizeStart, handlePointerDown, handlePointerMove } =
		usePlannerPointerInteractions(store, tasksColumnRef, {
			previewTaskIds,
			addPreviewTasksToGrid,
			removePreviewTasksFromGrid,
		})
	usePlannerKeyboard(store, tasksColumnRef, removePreviewTasksFromGrid)

	const gridLabel = computed(() =>
		t('planner.a11y.gridLabel', {
			start: store.viewStartTime.getString(),
			end: store.viewEndTime.getString(),
		}),
	)

	const gridHelp = computed(() => {
		const help = t('planner.a11y.gridHelp', { minutes: store.timeSlotDuration })
		return helpExtra ? `${help} ${helpExtra}` : help
	})

	const moveStatusMessage = ref('')
	watch(
		() => store.arrowMoveConflict,
		(conflict, wasConflict) => {
			if (conflict) moveStatusMessage.value = t('planner.a11y.moveConflict')
			else if (wasConflict) moveStatusMessage.value = t('planner.a11y.moveOk')
		},
	)

	function scrollToNow(): void {
		if (!store.viewedDate) return
		const viewedDate = store.viewedDate instanceof Date ? store.viewedDate : new Date(store.viewedDate)
		// A calendar day on the left, "what day is it now" on the right — see `useUserClock`.
		if (formatDateForApi(viewedDate) !== isoDateInUserZone()) return

		const slotIndex = store.timeToSlotIndex(timeInUserZone(currentTime.value))
		if (slotIndex < 0) return

		const grid = tasksColumnRef.value?.parentElement as HTMLElement
		if (!grid) return

		const nowPixel = slotIndex * SLOT_HEIGHT
		const isNowVisible = nowPixel >= grid.scrollTop && nowPixel <= grid.scrollTop + grid.clientHeight
		if (!isNowVisible) {
			grid.scrollTop = Math.max(0, nowPixel - grid.clientHeight / 3)
		}
	}

	watch(currentTime, scrollToNow)

	onMounted(() => {
		if (gridElement) gridElement.value = tasksColumnRef.value
		return nextTick(scrollToNow)
	})
</script>

<style scoped>
	.tasks-column {
		display: grid;
		position: relative;
		background: rgb(var(--v-theme-neutral-50));
		user-select: none;
		cursor: crosshair;
		touch-action: none;
	}

	.task-slot {
		border-top: 2px solid #9993;
		transition: background-color 0.2s ease;
	}

	.task-slot:nth-of-type(3n + 1) {
		border-top-width: 2px;
		border-top-color: #999b;
	}

	.task-slot.hoverable:hover {
		background-color: rgba(0, 0, 0, 0.02);
		cursor: cell;
	}

	.midnight-divider-tasks {
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

	.tasks-column.clipboard-mode *,
	.tasks-column.resizing-mode * {
		cursor: inherit !important;
	}
</style>
