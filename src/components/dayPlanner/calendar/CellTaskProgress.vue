<template>
	<div
		class="d-flex align-center ga-1 pa-0"
		style="font-size: 13px"
	>
		<VIcon
			icon="fas fa-list-check"
			size="small"
		/>
		<VTooltip
			v-if="smAndUp && tasks.length > 0"
			location="end"
		>
			<template #activator="{ props: tooltipProps }">
				<div
					v-bind="tooltipProps"
					class="flex-grow-1 d-flex flex-column ga-1"
				>
					<div class="d-flex align-center ga-2">
						<span class="text-no-wrap">{{ day.completedTasks }}/{{ day.totalTasks }} tasks</span>
						<VProgressLinear
							v-if="day.totalTasks > 0"
							:modelValue="day.completionRate"
							:color="completionColor"
							height="4"
							rounded
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
					<span>{{ task.activity.name }}</span>
				</div>
			</div>
		</VTooltip>
		<div
			v-else
			class="flex-grow-1 d-flex flex-column ga-1"
		>
			<div class="tasks-header">
				<span class="info-text">{{ day.completedTasks }}/{{ day.totalTasks }} tasks</span>
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
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'

	const props = defineProps<{
		day: Calendar
		tasks: PlannerTask[]
	}>()

	const { smAndUp } = useDisplay()

	const completionColor = computed(() =>
		props.day.completionRate >= 80 ? 'success' : props.day.completionRate >= 50 ? 'warning' : 'error',
	)
</script>
