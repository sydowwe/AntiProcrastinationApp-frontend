<template>
<BaseTaskBlock
	:task
	@resizeStart="emit('resizeStart', $event)"
>
</BaseTaskBlock>
</template>

<script setup lang="ts">
import {inject} from 'vue'
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import BaseTaskBlock from '@/components/dayPlanner/BaseTaskBlock.vue';

const store = inject<ReturnType<typeof useTemplateDayPlannerStore>>('plannerStore')!

const {task} = defineProps<{
	task: TemplatePlannerTask
}>()


const emit = defineEmits<{
	(e: 'resizeStart', payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }): void
}>()
</script>