<template>
	<BaseTaskBlock
		:class="classes"
		:task
		:backgroundColor="task.color"
		:isPast
		@resizeStart="emit('resizeStart', $event)"
		@keydown.space.prevent="handleToggleStatusSelected"
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
			<VMenu
				v-if="task.id >= 0"
				:disabled="store.isTemplateInPreview"
				location="bottom start"
				:closeOnContentClick="true"
			>
				<template #activator="{ props: menuProps }">
					<VIconBtn
						v-bind="menuProps"
						:icon="getPlannerTaskStatusIcon(task.status)"
						:color="getPlannerTaskStatusColor(task.status)"
						size="small"
						variant="text"
						class="status-btn"
						:style="task.importance?.importance !== 777 ? 'margin-right: -4px;' : ''"
						@click.stop
					/>
				</template>
				<VCard>
					<VList density="compact">
						<VListItem
							v-for="option in statusOptions"
							:key="option.value"
							:value="option.value"
							:active="task.status === option.value"
							color="primary"
							@click="emit('changeStatus', task.id, option.value as PlannerTaskStatus)"
						>
							<template #prepend>
								<VIcon
									:icon="getPlannerTaskStatusIcon(option.value)"
									:color="getPlannerTaskStatusColor(option.value)"
									size="small"
									class="mr-2"
								/>
							</template>
							{{ option.title }}
						</VListItem>
					</VList>
				</VCard>
			</VMenu>
		</template>
	</BaseTaskBlock>
</template>

<script setup lang="ts">
	import { computed, inject } from 'vue'
	import type { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useCurrentTime } from '@/composables/general/useCurrentTime.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import BaseTaskBlock from '../BaseTaskBlock.vue'
	import {
		getPlannerTaskStatusColor,
		getPlannerTaskStatusIcon,
		PlannerTaskStatus,
	} from '@/dtos/enum/PlannerTaskStatus.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'

	const { task } = defineProps<{
		task: PlannerTask
	}>()

	const emit = defineEmits<{
		resizeStart: [payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }]
		changeStatus: [taskId: number, status: PlannerTaskStatus]
	}>()

	const { currentTime } = useCurrentTime()

	const store = inject<ReturnType<typeof useDayPlannerStore>>('plannerStore')!

	const statusOptions = getEnumSelectOptions(PlannerTaskStatus, 'planner.status')

	const formattedTime = computed(() => (startTime: Time, endTime: Time) => {
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

	function handleToggleStatusSelected(): void {
		const selectedTaskIds = Array.from(store.selectedTaskIds)
		const allCompleted = selectedTaskIds.every(id => {
			const t = store.tasks.find(e => e.id === id)
			return t?.status === PlannerTaskStatus.Completed
		})
		const newStatus = allCompleted ? PlannerTaskStatus.NotStarted : PlannerTaskStatus.Completed

		selectedTaskIds.forEach(taskId => {
			const taskItem = store.tasks.find(e => e.id === taskId)
			if (!taskItem) return

			taskItem.status = newStatus
			taskItem.isDone = newStatus === PlannerTaskStatus.Completed

			store.updateTaskStatus(taskId, newStatus).catch(error => {
				console.error('Error updating task status:', error)
				taskItem.status = newStatus === PlannerTaskStatus.Completed ? PlannerTaskStatus.NotStarted : PlannerTaskStatus.Completed
				taskItem.isDone = !taskItem.isDone
			})
		})
	}
</script>
<style>
	.status-btn {
		z-index: 15;
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
