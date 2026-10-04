<template>
	<BaseTaskBlock
		:class="classes"
		:task
		:isPast
		:extraLabelParts
		extraKeyShortcuts="D"
		@resizeStart="emit('resizeStart', $event)"
		@keydown.d.exact.prevent="emit('toggleDone', task.id)"
	>
		<template #time>
			<div
				v-if="!task.isTaskOneRow"
				class="task-time"
				:class="{ 'text-decoration-line-through': task.actualStartTime && task.actualEndTime }"
			>
				{{ formattedTime(task.startTime, task.endTime) }}
			</div>
			<div
				v-if="!task.isTaskOneRow && task.actualStartTime && task.actualEndTime"
				class="task-time"
			>
				{{ formattedTime(task.actualStartTime, task.actualEndTime) }}
			</div>
			<!-- How many times this was pushed to a later day: "pushed 4×" is the cue to split or drop it. -->
			<div
				v-if="!task.isTaskOneRow && task.carryOverCount > 0"
				class="task-time d-flex align-center ga-1"
				:title="carriedOverLabel"
			>
				<VIconSmall icon="forward" />
				{{ t('planner.calendar.carriedOverBadge', { count: task.carryOverCount }) }}
			</div>
		</template>
		<template #checkbox>
			<VMenu
				v-if="task.id >= 0"
				:disabled="store.isTemplateInPreview"
				location="bottom start"
				closeOnContentClick
			>
				<template #activator="{ props: menuProps }">
					<ChipWithIcon
						v-bind="menuProps"
						class="task-chip status-chip"
						variant="flat"
						:size="task.isTaskOneRow ? 'x-small' : 'default'"
						:icon="getPlannerTaskStatusIcon(task.status)"
						:color="getPlannerTaskStatusColor(task.status)"
						@pointerdown.stop
						@click.stop
					>
						{{ t(`planner.status.${task.status}`) }}
					</ChipWithIcon>
				</template>
				<VCard>
					<VList density="compact">
						<VListItem
							v-for="option in statusOptions"
							v-show="task.status !== option.value"
							:key="option.value"
							:value="option.value"
							:prependIcon="getPlannerTaskStatusIcon(option.value)"
							:title="option.title"
							color="secondaryOutline"
							@click="emit('changeStatus', task.id, option.value)"
						></VListItem>
					</VList>
				</VCard>
			</VMenu>
		</template>
	</BaseTaskBlock>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import BaseTaskBlock from '../BaseTaskBlock.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import {
		getPlannerTaskStatusColor,
		getPlannerTaskStatusIcon,
		type PlannerTaskStatus,
		usePlannerTaskStatusOptions,
	} from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'

	const { task } = defineProps<{
		task: PlannerTask
	}>()

	const emit = defineEmits<{
		resizeStart: [payload: { taskId: number; direction: 'top' | 'bottom'; pointerEvent: PointerEvent }]
		changeStatus: [taskId: number, status: PlannerTaskStatus]
		/** The `D` shortcut. The view decides what it means, because completing goes through log time (F89). */
		toggleDone: [taskId: number]
	}>()

	const { t } = useI18n()

	const { currentTime } = useCurrentTime()

	// The concrete store, not the injected contract: `isTemplateInPreview` is not on the shared contract.
	// Safe to reach for the singleton here, because unlike the template planner the normal planner is
	// never mounted twice.
	const store = useDayPlannerStore()

	const statusOptions = usePlannerTaskStatusOptions()

	const formattedTime = computed(() => (startTime: Time, endTime: Time) => {
		// Default time formatting (can be overridden via slot)
		return `${Time.getString(startTime)} - ${Time.getString(endTime)}`
	})

	const isPast = computed(() => {
		const dateTime = new Date()
		dateTime.setHours(task.endTime.hours, task.endTime.minutes)
		return dateTime < currentTime.value
	})

	// The status is the one thing on the block that is signalled purely by a coloured chip, and the
	// base block's `role="button"` keeps that chip out of the accessibility tree entirely. Hand the
	// localized status down so it lands in the block's accessible name instead.
	const carriedOverLabel = computed(() =>
		t('planner.a11y.carriedOverPart', { count: task.carryOverCount }, task.carryOverCount),
	)

	const extraLabelParts = computed(() => [
		t('planner.a11y.statusPart', { status: t(`planner.status.${task.status}`) }),
		...(task.carryOverCount > 0 ? [carriedOverLabel.value] : []),
	])

	const classes = computed(() => {
		return {
			'pl-2': task.id < 0 && !task.isBackground,
			templatePreview: task.id < 0,
		}
	})
</script>
<style>
	.status-btn {
		z-index: 15;
		pointer-events: auto;
		cursor: pointer;
	}
	.status-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		pointer-events: auto;
		z-index: 15;
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
