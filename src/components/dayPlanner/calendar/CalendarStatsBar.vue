<template>
<VSheet
	v-if="days.length > 0"
	class="d-flex flex-wrap align-center ga-3 px-4 py-2 mb-2"
	rounded="lg"
	border
>
	<VChip
		size="small"
		variant="tonal"
		color="primary"
		prependIcon="fas fa-list-check"
	>
		{{ completedTasks }}/{{ totalTasks }} tasks
	</VChip>

	<VChip
		size="small"
		variant="tonal"
		:color="avgCompletion >= 80 ? 'success' : avgCompletion >= 50 ? 'warning' : 'error'"
		prependIcon="fas fa-chart-simple"
	>
		{{ avgCompletion }}% avg
	</VChip>

	<VChip
		v-if="streak > 0"
		size="small"
		variant="tonal"
		color="successDark"
		prependIcon="fas fa-fire"
	>
		{{ streak }}-day streak
	</VChip>

	<VChip
		v-if="plannedDays > 0"
		size="small"
		variant="tonal"
		color="secondary"
		prependIcon="fas fa-calendar-days"
	>
		{{ plannedDays }}/{{ pastDays }} days planned
	</VChip>
</VSheet>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'

const props = defineProps<{
	days: Calendar[]
}>()

const totalTasks = computed(() => props.days.reduce((s, d) => s + d.totalTasks, 0))
const completedTasks = computed(() => props.days.reduce((s, d) => s + d.completedTasks, 0))

const today = new Date().toISOString().slice(0, 10)

const pastDays = computed(() => props.days.filter(d => d.date <= today).length)
const plannedDays = computed(() => props.days.filter(d => d.date <= today && d.totalTasks > 0).length)

const daysWithTasks = computed(() => props.days.filter(d => d.totalTasks > 0))
const avgCompletion = computed(() => {
	if (!daysWithTasks.value.length) return 0
	return Math.round(daysWithTasks.value.reduce((s, d) => s + d.completionRate, 0) / daysWithTasks.value.length)
})

const streak = computed(() => {
	const sorted = [...props.days]
		.filter(d => d.date <= today && d.totalTasks > 0)
		.sort((a, b) => b.date.localeCompare(a.date))
	let count = 0
	for (const d of sorted) {
		if (d.completionRate >= 100) count++
		else break
	}
	return count
})
</script>
