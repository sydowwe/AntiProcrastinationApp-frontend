<template>
	<!-- Below `sm` a month-grid cell is ~50 px wide: only `N/M` and the bar fit. A day with no tasks shows
	     nothing rather than "0/0". -->
	<div
		v-if="!smAndUp"
		class="d-flex flex-column ga-1"
	>
		<template v-if="day.totalTasks > 0">
			<span
				class="text-no-wrap font-weight-bold"
				style="font-size: 11px"
				:class="completionColor"
			>
				{{ day.completedTasks }}/{{ day.totalTasks }}
			</span>
			<VProgressLinear
				:modelValue="day.completionRate"
				:color="completionColor"
				height="4"
				rounded
			/>
		</template>
	</div>
	<div
		v-else
		class="d-flex align-center ga-1 pa-0"
		style="font-size: 13px"
	>
		<VIcon
			icon="fas fa-list-check"
			size="small"
		/>
		<VTooltip
			v-if="tasks.length > 0"
			location="end"
		>
			<template #activator="{ props: tooltipProps }">
				<div
					v-bind="tooltipProps"
					class="flex-grow-1 d-flex flex-column ga-1"
				>
					<!-- Wraps between `sm` and `md`, where a cell is ~90 px and the one-line row needs ~120: the
					     bar and the percentage drop under the count instead of overrunning the cell. -->
					<div class="d-flex flex-wrap align-center ga-2">
						<span class="text-no-wrap">
							{{
								$t(
									'planner.calendar.completedOfTotalTasks',
									{ completed: day.completedTasks, count: day.totalTasks },
									day.totalTasks,
								)
							}}
						</span>
						<VProgressLinear
							v-if="day.totalTasks > 0"
							:modelValue="day.completionRate"
							:color="completionColor"
							height="4"
							rounded
							style="flex: 1 1 16px"
						/>
						<span
							v-if="day.totalTasks > 0"
							class="text-caption font-weight-bold text-no-wrap"
							:class="completionColor"
						>
							{{ Math.round(day.completionRate) }}%
						</span>
					</div>
				</div>
			</template>
			<div
				class="d-flex flex-column ga-1 text-caption"
				style="max-width: 260px"
			>
				<div
					v-for="task in tasks"
					:key="task.id"
					class="d-flex ga-2"
				>
					<span
						class="text-no-wrap"
						style="opacity: 0.7"
					>
						{{ task.startTime.getString() }}–{{ task.endTime.getString() }}
					</span>
					<span>{{ task.activityName }}</span>
				</div>
			</div>
		</VTooltip>
		<div
			v-else
			class="flex-grow-1 d-flex flex-column ga-1"
		>
			<div class="tasks-header">
				<span class="info-text">
					{{
						$t(
							'planner.calendar.completedOfTotalTasks',
							{ completed: day.completedTasks, count: day.totalTasks },
							day.totalTasks,
						)
					}}
				</span>
				<span
					v-if="day.totalTasks > 0"
					class="text-caption font-weight-bold text-no-wrap"
					:class="completionColor"
				>
					{{ Math.round(day.completionRate) }}%
				</span>
			</div>
			<VProgressLinear
				v-if="day.totalTasks > 0"
				:modelValue="day.completionRate"
				:color="completionColor"
				height="4"
				rounded
				class="mt-1"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useDisplay } from 'vuetify/framework'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import type { CalendarTaskSummary } from '@/core/dayPlanner/dto/response/CalendarTaskSummary.ts'

	const props = defineProps<{
		day: Calendar
		tasks: CalendarTaskSummary[]
	}>()

	const { smAndUp } = useDisplay()

	const completionColor = computed(() =>
		props.day.completionRate >= 80 ? 'success' : props.day.completionRate >= 50 ? 'warning' : 'error',
	)
</script>
