<template>
<div class="header-bar" v-if="calendar">
	<!-- Left: Date + Edit -->
	<div class="left-section">
		<VIconBtn
			variant="tonal"
			@click="expanded = !expanded"
			icon="info"
			height="40"
			width="50"
		>
			<VIcon style="margin-left: -2px;margin-right: 4px" t size="16" :icon="expanded ? 'chevron-right' : 'chevron-left'"/>
			<VIcon size="16"/>
			<VTooltip activator="parent" location="bottom">
				{{ expanded ? 'Hide details' : 'Show details' }}
			</VTooltip>
		</VIconBtn>
		<h1 class="date-title">{{ title }}</h1>

		<DayTypeChip :dayType="calendar.dayType" isTonal></DayTypeChip>
		<div
			v-if="calendar?.label"
			class="mt-1 text-medium-emphasis font-italic text-body-2"
			style="margin-left: -4px"
		>
			{{ calendar.label }}
		</div>
	</div>

	<!-- Center: Progress -->
	<div class="center-section">
		<TimeRangePicker
			startIcon="sun"
			endIcon="moon"
			v-model:start="store.viewStartTime"
			v-model:end="store.viewEndTime"
		/>
	</div>

	<!-- Right: Time + Add -->
	<div class="d-flex ga-3">
		<div class="flex-1-1-100 progress-block">
			<div class="progress-header">
				<VIcon icon="list-check" size="18"/>
				<span class="progress-label">{{ calendar.completedTasks }}/{{ calendar.totalTasks }} tasks</span>
				<span class="progress-percent" :style="{ color: progressColor }">
						{{ Math.round(calendar.completionRate) }}%
					</span>
			</div>
			<VProgressLinear
				:modelValue="calendar.completionRate"
				:color="progressColorName"
				height="6"
				rounded
				class="progress-bar"
			/>
		</div>

		<VBtn
			color="primary"
			:disabled="store.isTemplateInPreview"
			@click="store.openCreateDialogEmpty"
		>
			<VIcon icon="plus" size="18" class="mr-2"/>
			Add Task
		</VBtn>

		<VBtn
			color="secondaryOutline"
			variant="tonal"
			to="/day-planner"
			prependIcon="far fa-calendar"
		>
			Calendar
		</VBtn>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts'
import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue';

const store = useDayPlannerStore()
const expanded = defineModel('expandedDetails', {required: true})

const props = defineProps<{
	title: string
	calendar?: Calendar,
}>()

const progressColorName = computed(() => {
	if (!props.calendar) return 'grey'
	const rate = props.calendar.completionRate
	if (rate >= 80) return 'success'
	if (rate >= 50) return 'warning'
	return 'error'
})

const progressColor = computed(() => {
	if (!props.calendar) return 'inherit'
	const rate = props.calendar.completionRate
	if (rate >= 80) return 'rgb(var(--v-theme-success))'
	if (rate >= 50) return 'rgb(var(--v-theme-warning))'
	return 'rgb(var(--v-theme-error))'
})
</script>

<style scoped>
.header-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px 0;
	gap: 24px;
}

.left-section {
	display: flex;
	align-items: center;
	gap: 12px;
}

.date-title {
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
}

.progress-block {
	width: 200px;
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