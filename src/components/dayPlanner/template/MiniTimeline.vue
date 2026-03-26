<template>
<div class="d-flex align-center ga-2">
	<div class="mini-timeline">
		<div
			v-for="(task, index) in nonBackgroundTasks"
			:key="index"
			class="mini-timeline-segment"
			:style="{
				left: `${getPosition(task).left}%`,
				width: `${getPosition(task).width}%`,
				backgroundColor: task.color || '#5c2caa',
			}"
		/>
		<div
			v-for="(task, index) in backgroundTasks"
			:key="`bg-${index}`"
			class="mini-timeline-segment mini-timeline-bg"
			:style="{
				left: `${getPosition(task).left}%`,
				width: `${getPosition(task).width}%`,
				backgroundColor: task.color || '#5c2caa',
			}"
		/>
	</div>
	<span class="text-caption text-medium-emphasis">{{ tasks.length }}</span>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
import type {Time} from '@/dtos/dto/Time.ts'

const props = defineProps<{
	tasks: TemplatePlannerTask[]
	startTime: Time
	endTime: Time
}>()

const totalMinutes = computed(() => {
	const start = props.startTime.getInMinutes
	const end = props.endTime.getInMinutes
	return end > start ? end - start : end + 1440 - start
})

const nonBackgroundTasks = computed(() => props.tasks.filter(t => !t.isBackground))
const backgroundTasks = computed(() => props.tasks.filter(t => t.isBackground))

function getPosition(task: TemplatePlannerTask) {
	const rangeStart = props.startTime.getInMinutes
	const taskStart = task.startTime.getInMinutes
	const taskEnd = task.endTime.getInMinutes

	const startOffset = (taskStart - rangeStart + 1440) % 1440
	const duration = taskEnd > taskStart ? taskEnd - taskStart : taskEnd + 1440 - taskStart

	const left = (startOffset / totalMinutes.value) * 100
	const width = Math.max((duration / totalMinutes.value) * 100, 1)

	return {left, width}
}
</script>

<style scoped>
.mini-timeline {
	position: relative;
	width: 100%;
	height: 12px;
	background: rgba(var(--v-theme-on-surface), 0.08);
	border-radius: 6px;
	overflow: hidden;
}

.mini-timeline-segment {
	position: absolute;
	top: 1px;
	height: 10px;
	border-radius: 4px;
	min-width: 2px;
}

.mini-timeline-bg {
	opacity: 0.3;
	top: 0;
	height: 12px;
}
</style>
