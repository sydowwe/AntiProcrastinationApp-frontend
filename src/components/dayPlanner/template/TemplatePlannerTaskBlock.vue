<template>
	<BaseTaskBlock
		:task
		@resizeStart="emit('resizeStart', $event)"
	>
		<template
			v-if="isSplitView"
			#prepend
		>
			<div
				:ref="el => setupDragHandle(el as HTMLElement | null)"
				class="split-drag-handle"
				title="Drag to other template"
				@click.stop
				@pointerdown.stop
			>
				<VIcon
					icon="grip-lines-vertical"
					size="14"
					color="grey-lighten-1"
				/>
			</div>
		</template>
	</BaseTaskBlock>
</template>

<script setup lang="ts">
	import { inject, onBeforeUnmount } from 'vue'
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
	import BaseTaskBlock from '@/components/dayPlanner/BaseTaskBlock.vue'
	import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'

	const { task } = defineProps<{
		task: TemplatePlannerTask
	}>()

	const emit = defineEmits<{
		(e: 'resizeStart', payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void
	}>()

	const isSplitView = inject<boolean>('isSplitView', false)
	const storeId = inject<string>('splitViewStoreId', 'main')

	let dragCleanup: (() => void) | null = null

	function setupDragHandle(el: HTMLElement | null) {
		if (dragCleanup) {
			dragCleanup()
			dragCleanup = null
		}
		if (!el) return

		dragCleanup = draggable({
			element: el,
			getInitialData: () => ({
				type: 'cross-template-task',
				taskId: task.id,
				sourceStoreId: storeId,
				templateId: task.templateId,
			}),
		})
	}

	onBeforeUnmount(() => {
		if (dragCleanup) dragCleanup()
	})
</script>

<style scoped>
	.split-drag-handle {
		cursor: grab;
		padding: 2px 4px;
		display: flex;
		align-items: center;
		opacity: 0.5;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.split-drag-handle:hover {
		opacity: 1;
	}

	.split-drag-handle:active {
		cursor: grabbing;
	}
</style>
