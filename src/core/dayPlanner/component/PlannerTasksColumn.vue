<!-- TasksColumn.vue -->
<template>
	<div
		ref="tasksColumnRef"
		class="tasks-column"
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
	</div>
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
	import { inject, nextTick, onMounted, ref, watch } from 'vue'
	import CreationPreview from './misc/CreationPreview.vue'
	import { useCurrentTimeIndicator } from '@/core/dayPlanner/composable/useCurrentTimeIndicator.ts'
	import { SLOT_HEIGHT } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
	import { type IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
	import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
	import type { IBaseDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { usePlannerClipboardPreview } from '@/core/dayPlanner/composable/usePlannerClipboardPreview.ts'
	import { usePlannerPointerInteractions } from '@/core/dayPlanner/composable/usePlannerPointerInteractions.ts'
	import { usePlannerKeyboard } from '@/core/dayPlanner/composable/usePlannerKeyboard.ts'

	const store = inject<TStore>('plannerStore')!

	const tasksColumnRef = ref<HTMLElement | undefined>(undefined)
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

	onMounted(() => nextTick(scrollToNow))
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
