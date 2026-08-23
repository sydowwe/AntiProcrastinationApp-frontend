<template>
	<VSheet
		v-if="days.length > 0"
		class="d-flex flex-wrap align-center ga-2 pa-2"
		rounded="lg"
		style="border-color: #444"
		border
	>
		<ChipWithIcon
			size="small"
			variant="tonal"
			color="primaryOutline"
			icon="list-check"
		>
			{{
				$t(
					'planner.calendar.completedOfTotalTasks',
					{ completed: completedTasks, count: totalTasks },
					totalTasks,
				)
			}}
		</ChipWithIcon>

		<ChipWithIcon
			size="small"
			variant="tonal"
			:color="avgCompletion >= 80 ? 'success' : avgCompletion >= 50 ? 'warning' : 'error'"
			icon="chart-simple"
		>
			{{ $t('planner.calendar.avgCompletion', { percent: avgCompletion }) }}
		</ChipWithIcon>

		<ChipWithIcon
			v-if="streak > 0"
			size="small"
			variant="tonal"
			color="success"
			icon="fire"
		>
			{{ $t('planner.calendar.dayStreak', { count: streak }, streak) }}
		</ChipWithIcon>

		<ChipWithIcon
			v-if="plannedDays > 0"
			size="small"
			variant="tonal"
			color="secondaryOutline"
			icon="calendar-days"
		>
			{{ $t('planner.calendar.daysPlanned', { planned: plannedDays, past: pastDays }) }}
		</ChipWithIcon>
	</VSheet>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'

	const props = defineProps<{
		days: Calendar[]
	}>()

	const totalTasks = computed(() => props.days.reduce((s, d) => s + d.totalTasks, 0))
	const completedTasks = computed(() => props.days.reduce((s, d) => s + d.completedTasks, 0))

	// Computed, not captured at setup, and in the user's zone rather than UTC: this bar is on a
	// month view that stays open, and every stat below is a "up to and including today" cut.
	const today = computed(() => isoDateInUserZone())

	const pastDays = computed(() => props.days.filter(d => d.date <= today.value).length)
	const plannedDays = computed(() => props.days.filter(d => d.date <= today.value && d.totalTasks > 0).length)

	const daysWithTasks = computed(() => props.days.filter(d => d.totalTasks > 0))
	const avgCompletion = computed(() => {
		if (!daysWithTasks.value.length) return 0
		return Math.round(daysWithTasks.value.reduce((s, d) => s + d.completionRate, 0) / daysWithTasks.value.length)
	})

	const streak = computed(() => {
		const sorted = [...props.days]
			.filter(d => d.date <= today.value && d.totalTasks > 0)
			.sort((a, b) => b.date.localeCompare(a.date))
		let count = 0
		for (const d of sorted) {
			if (d.completionRate >= 100) count++
			else break
		}
		return count
	})
</script>
