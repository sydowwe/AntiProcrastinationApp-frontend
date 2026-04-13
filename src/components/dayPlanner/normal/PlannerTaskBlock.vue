<template>
	<BaseTaskBlock
		:class="classes"
		:task
		:backgroundColor="task.color"
		:isPast
		@resizeStart="emit('resizeStart', $event)"
		@keydown.space.prevent="handleToggleIsDoneSelected"
	>
		<template #time>
			<div
				class="task-time"
				:class="{ 'text-decoration-line-through': task.actualStartTime && task.actualEndTime }"
			>
				{{ formattedTime(task.startTime, task.endTime) }}
			</div>
			<div
				v-if="task.actualStartTime && task.actualEndTime"
				class="task-time"
			>
				{{ formattedTime(task.actualStartTime, task.actualEndTime) }}
			</div>
		</template>
		<template #checkbox>
			<div class="status-column">
				<VCheckbox
					v-if="task.id >= 0"
					:modelValue="task.isDone"
					:disabled="store.isTemplateInPreview"
					class="task-checkbox"
					density="default"
					hideDetails
					@update:modelValue="val => val ? emit('logTime', task.id) : emit('toggleIsDone', task.id)"
					@click.stop
				/>
				<VMenu :disabled="store.isTemplateInPreview || task.id < 0">
					<template #activator="{ props: menuProps }">
						<ChipWithIcon
							v-bind="menuProps"
							class="task-chip status-chip"
							size="x-small"
							variant="flat"
							:icon="getPlannerTaskStatusIcon(task.status)"
							:color="getPlannerTaskStatusColor(task.status)"
							@click.stop
						>
							{{ task.status }}
						</ChipWithIcon>
					</template>
					<VList density="compact">
						<VListItem
							v-for="status in allStatuses"
							:key="status"
							:prependIcon="getPlannerTaskStatusIcon(status)"
							:title="status"
							@click="emit('changeStatus', task.id, status)"
						/>
					</VList>
				</VMenu>
			</div>
		</template>
	</BaseTaskBlock>
</template>

<script setup lang="ts">
	import { computed, inject } from 'vue'
	import type { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useCurrentTime } from '@/composables/general/useCurrentTime.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import BaseTaskBlock from '../BaseTaskBlock.vue'
	import ChipWithIcon from '@/components/general/ChipWithIcon.vue'
	import {
		getPlannerTaskStatusColor,
		getPlannerTaskStatusIcon,
		PlannerTaskStatus,
	} from '@/dtos/enum/PlannerTaskStatus.ts'
	import { Time } from '@/dtos/dto/Time.ts'

	const { task } = defineProps<{
		task: PlannerTask
	}>()

	const emit = defineEmits<{
		resizeStart: [payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }]
		toggleIsDone: [taskId: number]
		logTime: [taskId: number]
		changeStatus: [taskId: number, status: PlannerTaskStatus]
	}>()

	const allStatuses = Object.values(PlannerTaskStatus)

	const { currentTime } = useCurrentTime()

	const store = inject<ReturnType<typeof useDayPlannerStore>>('plannerStore')!

	const formattedTime = computed(() => (startTime: Time, endTime: Time) => {
		// Default time formatting (can be overridden via slot)
		return `${Time.getString(startTime)} - ${Time.getString(endTime)}`
	})

	const isPast = computed(() => {
		const dateTime = new Date()
		dateTime.setHours(task.endTime.hours, task.endTime.minutes)
		return dateTime < currentTime.value
	})

	const classes = computed(() => {
		return {
			'pl-2': task.id < 0 && !task.isBackground,
			templatePreview: task.id < 0,
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

			store.updateTaskIsDone(taskId, newIsDone).catch(error => {
				console.error('Error updating task isDone:', error)
				taskTask.isDone = !newIsDone
			})
		})
	}
</script>
<style>
	.status-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		pointer-events: auto;
		z-index: 15;
	}

	.task-checkbox {
		pointer-events: auto;
		cursor: pointer;
	}

	.task-checkbox.v-checkbox .v-selection-control {
		min-height: 0 !important;
	}

	.status-chip {
		pointer-events: auto;
		cursor: pointer;
	}

	.task-time {
		font-size: 0.8rem;
		opacity: 0.9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
