<template>
	<div class="d-flex align-center ga-2">
		<span v-if="label">{{ label }}</span>
		<div class="mini-timeline">
			<div
				v-for="(task, index) in nonBackgroundTasks"
				:key="index"
				class="mini-timeline-segment"
				:style="{
					left: `${getPosition(task).left}%`,
					width: `${getPosition(task).width}%`,
					backgroundColor: task.color || '#5c2caa',
					...laneRowStyle(index),
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
		<span v-if="showCount">
			{{ tasks.length }}
		</span>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { ITimelineTask } from '@/core/dayPlanner/dto/ITimelineTask.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import { assignLanes } from '@/core/dayPlanner/utils/plannerLanes.ts'

	const {
		tasks,
		startTime,
		endTime,
		label,
		showCount = true,
	} = defineProps<{
		tasks: ITimelineTask[]
		startTime: Time
		endTime: Time
		label?: string
		showCount?: boolean
	}>()

	const totalMinutes = computed(() => {
		const start = startTime.getInMinutes
		const end = endTime.getInMinutes
		return end > start ? end - start : end + 1440 - start
	})

	const nonBackgroundTasks = computed(() => tasks.filter(t => !t.isBackground))
	const backgroundTasks = computed(() => tasks.filter(t => t.isBackground))

	/**
	 * Two blocks side by side on the day grid (`plannerLanes.ts`) share the strip's height here, one row
	 * each, instead of the later one hiding the earlier. Keyed by index: timeline tasks carry no id.
	 */
	const lanes = computed(() =>
		assignLanes(
			nonBackgroundTasks.value.map((task, index) => {
				const start = (task.startTime.getInMinutes - startTime.getInMinutes + 1440) % 1440
				const end = start + ((task.endTime.getInMinutes - task.startTime.getInMinutes + 1440) % 1440)
				return { id: index, start, end, isBackground: false }
			}),
		),
	)

	/** Half of the 14 px segment each: 5 px plus a 1 px border, on rows starting at 1 px and 8 px. */
	function laneRowStyle(index: number): Record<string, string> {
		const lane = lanes.value.get(index)
		if (!lane || lane.laneCount < 2) return {}
		return { top: `${1 + lane.lane * 7}px`, height: '5px', borderWidth: '1px' }
	}

	function getPosition(task: ITimelineTask) {
		const rangeStart = startTime.getInMinutes
		const taskStart = task.startTime.getInMinutes
		const taskEnd = task.endTime.getInMinutes

		const startOffset = (taskStart - rangeStart + 1440) % 1440
		const duration = taskEnd > taskStart ? taskEnd - taskStart : taskEnd + 1440 - taskStart

		const left = (startOffset / totalMinutes.value) * 100
		const width = Math.max((duration / totalMinutes.value) * 100, 1)

		return { left, width }
	}
</script>

<style scoped>
	.mini-timeline {
		position: relative;
		width: 100%;
		height: 16px;
		background: rgba(var(--v-theme-on-surface), 0.08);
		border-radius: 3px;
		padding: 0 4px;
		overflow: hidden;
	}

	.mini-timeline-segment {
		position: absolute;
		top: 1px;
		height: 14px;
		border-radius: 3px;
		border: 2px solid #313131;
		min-width: 3px;
	}

	.mini-timeline-bg {
		opacity: 0.3;
	}
</style>
