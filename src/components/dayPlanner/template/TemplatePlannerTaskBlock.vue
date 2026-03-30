<template>
	<BaseTaskBlock
		:task
		@resizeStart="emit('resizeStart', $event)"
	></BaseTaskBlock>
</template>

<script setup lang="ts">
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
	import BaseTaskBlock from '@/components/dayPlanner/BaseTaskBlock.vue'

	const { task } = defineProps<{
		task: TemplatePlannerTask
	}>()

	const emit = defineEmits<{
		(e: 'resizeStart', payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void
	}>()
</script>
