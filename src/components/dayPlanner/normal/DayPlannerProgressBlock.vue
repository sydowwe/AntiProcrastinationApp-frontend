<template>
	<div class="progress-block">
		<div class="progress-header">
			<VIcon
				icon="list-check"
				size="18"
			/>
			<span class="progress-label">{{ calendar.completedTasks }}/{{ calendar.totalTasks }} tasks</span>
			<span
				class="progress-percent"
				:style="{ color: progressColor }"
			>
				{{ Math.round(calendar.completionRate) }}%
			</span>
		</div>
		<VProgressLinear
			:modelValue="calendar.completionRate"
			:color="progressColorName"
			height="6"
			rounded
		/>
		<div class="d-flex ga-2 mt-1 text-caption text-medium-emphasis">
			<span>{{ timeNiceFromMinutes(taskStats.plannedMinutes) }} planned</span>
			<span>·</span>
			<span
				v-if="taskStats.overMinutes === 0"
				:class="taskStats.freeMinutes > 0 ? 'text-success' : 'text-medium-emphasis'"
			>
				{{ timeNiceFromMinutes(taskStats.freeMinutes) }} free
			</span>
			<span
				v-else
				class="text-error font-weight-medium"
			>
				<VIcon
					icon="triangle-exclamation"
					size="11"
					class="mr-1"
				/>
				{{ timeNiceFromMinutes(taskStats.overMinutes) }} over capacity
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'

	const { calendar } = defineProps<{
		calendar: Calendar
	}>()

	const store = useDayPlannerStore()
	const { timeNiceFromMinutes } = useDateTime()

	const progressColorName = computed(() => {
		const rate = calendar.completionRate
		if (rate >= 80) return 'success'
		if (rate >= 50) return 'warning'
		return 'error'
	})

	const progressColor = computed(() => {
		const rate = calendar.completionRate
		if (rate >= 80) return 'rgb(var(--v-theme-success))'
		if (rate >= 50) return 'rgb(var(--v-theme-warning))'
		return 'rgb(var(--v-theme-error))'
	})

	const taskStats = computed(() => {
		const nonBgTasks = store.tasks.filter(t => !t.isBackground && t.id > 0)
		const plannedMinutes = nonBgTasks.reduce((sum, t) => {
			const start = t.startTime.getInMinutes
			const end = t.endTime.getInMinutes
			return sum + (end > start ? end - start : end + 1440 - start)
		}, 0)
		const viewStart = store.viewStartTime.getInMinutes
		const viewEnd = store.viewEndTime.getInMinutes
		const totalViewMinutes = viewEnd > viewStart ? viewEnd - viewStart : viewEnd + 1440 - viewStart
		const freeMinutes = Math.max(0, totalViewMinutes - plannedMinutes)
		const overMinutes = Math.max(0, plannedMinutes - totalViewMinutes)
		return { plannedMinutes, freeMinutes, overMinutes }
	})
</script>

<style scoped>
	.progress-block {
		width: 225px;
		max-width: 300px;
	}

	.progress-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}

	.progress-label {
		font-size: 0.875rem;
		color: rgba(var(--v-theme-on-surface), 0.7);
	}

	.progress-percent {
		margin-left: auto;
		font-weight: 700;
		font-size: 0.875rem;
	}
</style>
