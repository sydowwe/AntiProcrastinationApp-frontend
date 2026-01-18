<template>
<BaseTaskBlock
	:class="classes"
	:task
	:backgroundColor="task.color"
	:isPast
	@resizeStart="emit('resizeStart', $event)"
	@keydown.space.prevent="handleToggleIsDoneSelected"
>
	<template #checkbox>
		<VCheckbox
			v-if="task.id >= 0"
			:disabled="store.isTemplateInPreview"
			v-model="task.isDone"
			@update:modelValue="emit('toggleIsDone', task.id)"
			class="task-checkbox"
			density="default"
			hideDetails
			@click.stop
		/>
	</template>
</BaseTaskBlock>
</template>

<script setup lang="ts">
import {computed, inject} from 'vue'
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {useCurrentTime} from '@/composables/general/useCurrentTime.ts';
import type {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import BaseTaskBlock from '../BaseTaskBlock.vue';

const {currentTime} = useCurrentTime()

const store = inject<ReturnType<typeof useDayPlannerStore>>('plannerStore')!

const {task} = defineProps<{
	task: PlannerTask
}>()

const isPast = computed(() => {
	const dateTime = new Date();
	dateTime.setHours(task.endTime.hours, task.endTime.minutes);
	return dateTime < currentTime.value
})

const classes = computed(() => {
	return {
		'pl-2': task.id < 0 && !task.isBackground,
		'templatePreview': task.id < 0
	}
})

function handleToggleIsDoneSelected(): void {
	// Toggle isDone for all selected tasks
	const selectedTaskIds = Array.from(store.selectedTaskIds)

	selectedTaskIds.forEach(taskId => {
		const taskTask = store.tasks.find(e => e.id === taskId)
		if (!taskTask) return

		const newIsDone = !taskTask.isDone
		taskTask.isDone = newIsDone

		store.updateTaskIsDone(taskId, newIsDone)
			.catch((error) => {
				taskTask.isDone = !newIsDone
			})
	})
}

const emit = defineEmits<{
	resizeStart: [payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }],
	toggleIsDone: [taskId: number]
}>()
</script>
<style>
.task-checkbox {
	z-index: 15;
	padding: 0 5px;
	margin-right: -5px;
}

.task-block.done-task {
	opacity: 0.65;
	filter: saturate(0.5);
}

.task-block.done-task .task-title {
	text-decoration: line-through;
	opacity: 0.7;
}

.task-block.done-task .task-time {
	opacity: 0.6;
}

.base-task-block.templatePreview {
	z-index: 50;
	background-image: repeating-linear-gradient(
		50deg,
		transparent,
		transparent 10px,
		rgba(0, 0, 0, 0.07) 10px,
		rgba(0, 0, 0, 0.07) 20px
	) !important;
	border: 2px solid rgba(var(--v-theme-secondary), 0.7);
}
</style>