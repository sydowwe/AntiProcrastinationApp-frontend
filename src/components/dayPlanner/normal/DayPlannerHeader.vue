<template>
	<div
		v-if="calendar"
		class="header-bar"
	>
		<!-- Left: Date + Edit -->
		<div class="left-section">
			<VIconBtn
				variant="tonal"
				color="secondaryOutline"
				icon="bars"
				@click="expanded = !expanded"
			>
				<VIcon size="24" />
				<VTooltip
					activator="parent"
					location="bottom"
				>
					{{ expanded ? 'Hide details' : 'Show details' }}
				</VTooltip>
			</VIconBtn>
			<VIconBtn
				variant="tonal"
				density="comfortable"
				icon="chevron-left"
				@click="emit('navigateDate', -1)"
			></VIconBtn>
			<h1 class="date-title">{{ title }}</h1>
			<VIconBtn
				variant="tonal"
				density="comfortable"
				icon="chevron-right"
				@click="emit('navigateDate', 1)"
			></VIconBtn>
			<DayTypeChip
				:dayType="calendar.dayType"
				isTonal
			></DayTypeChip>
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
				v-model:start="store.viewStartTime"
				v-model:end="store.viewEndTime"
				startIcon="sun"
				endIcon="moon"
			/>
		</div>

		<!-- Right: Time + Add -->
		<div class="d-flex ga-3 align-center">
			<div class="flex-1-1-100 progress-block">
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
					class="progress-bar"
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

			<VTooltip
				:text="undoTooltip"
				location="bottom"
			>
				<template #activator="{ props: tooltipProps }">
					<VBtn
						v-bind="tooltipProps"
						variant="tonal"
						color="secondaryOutline"
						:disabled="!canUndo"
						@click="emit('undo')"
					>
						<VIcon icon="rotate-left" />
						<VBadge
							v-if="stackSize > 0"
							:content="stackSize"
							color="primary"
							floating
						/>
					</VBtn>
				</template>
			</VTooltip>

			<VBtn
				color="primary"
				:disabled="store.isTemplateInPreview || !store.canCreate"
				@click="store.openCreateDialog"
			>
				<VIcon
					icon="plus"
					size="18"
					class="mr-2"
				/>
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
	import { computed } from 'vue'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import DayTypeChip from '@/components/dayPlanner/misc/DayTypeChip.vue'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'

	const props = defineProps<{
		title: string
		calendar?: Calendar
	}>()
	const emit = defineEmits<{
		navigateDate: [delta: number]
		undo: []
	}>()
	const expanded = defineModel<boolean>('expandedDetails', { required: true })
	const store = useDayPlannerStore()
	const { canUndo, stackSize, nextUndoDescription, nextUndoDate } = useUndoStack()
	const { timeNiceFromMinutes, formatToDateWithDay } = useDateTime()

	const undoTooltip = computed(() => {
		if (!nextUndoDescription.value) return 'Nothing to undo'
		const isOtherDay =
			nextUndoDate.value &&
			!(
				nextUndoDate.value.getFullYear() === store.viewedDate.getFullYear() &&
				nextUndoDate.value.getMonth() === store.viewedDate.getMonth() &&
				nextUndoDate.value.getDate() === store.viewedDate.getDate()
			)
		return isOtherDay
			? `Undo: ${nextUndoDescription.value} · go to ${formatToDateWithDay(nextUndoDate.value!)}`
			: `Undo: ${nextUndoDescription.value}`
	})

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
