<template>
	<BaseTodoListItem
		:kind="ToDoListKind.ROUTINE"
		:listId
		:toDoListItem
		:color="toDoListItem.color"
		@edit="emits('edit', $event)"
		@delete="emits('delete', $event)"
		@isDoneChanged="(id: number, forceValue: boolean) => emits('isDoneChanged', id, forceValue)"
		@stepToggled="emits('stepToggled')"
		@addToPlanner="emits('addToPlanner', $event)"
		@logTime="emits('logTime', $event)"
		@itemClicked="emits('itemClicked', $event)"
	>
		<template #pre-chips="{ isInChangeOrderMode }">
			<VTooltip
				v-if="toDoListItem.streak > 0 && !isInChangeOrderMode"
				location="top"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="d-flex align-center ga-1 mt-1 mr-1"
						:class="gracePeriodActive ? 'text-warning' : 'text-white'"
					>
						<VIcon
							:icon="getMilestoneIcon(toDoListItem.streak) ?? 'fire-flame-curved'"
							size="14"
						></VIcon>
						<span
							class="text-caption"
							style="line-height: 1"
						>
							{{ toDoListItem.streak }}
						</span>
					</div>
				</template>
				<span>
					Streak: {{ toDoListItem.streak }} | Best: {{ toDoListItem.bestStreak }}
					<span v-if="gracePeriodActive">| Grace period active!</span>
				</span>
			</VTooltip>
		</template>
		<template #post-chips>
			<VChip
				v-if="toDoListItem.suggestedDay"
				size="x-small"
				variant="tonal"
				color="neutral-600"
				prependIcon="calendar-day"
			>
				{{ weekDayNames[toDoListItem.suggestedDay - 1] }}
			</VChip>
		</template>
	</BaseTodoListItem>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import BaseTodoListItem from '@/components/toDoList/BaseTodoListItem.vue'

	const { toDoListItem, streakConfig } = defineProps<{
		toDoListItem: RoutineTodoListItemEntity
		streakConfig?: { graceDays: number; periodLengthInDays: number }
		isInChangeOrderMode?: boolean
		listId: number
		isDragging?: boolean
	}>()

	const emits = defineEmits<{
		edit: [toDoListItem: RoutineTodoListItemEntity]
		delete: [id: number]
		isDoneChanged: [id: number, forceValue?: boolean]
		stepToggled: []
		addToPlanner: [toDoListItem: RoutineTodoListItemEntity]
		logTime: [toDoListItem: RoutineTodoListItemEntity]
		itemClicked: [toDoListItem: RoutineTodoListItemEntity]
	}>()

	const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

	const gracePeriodActive = computed(() => {
		if (!streakConfig || !toDoListItem.lastCompletedAt || !toDoListItem.streak) return false
		const { graceDays, periodLengthInDays } = streakConfig
		if (graceDays <= 0) return false
		const lastDone = new Date(toDoListItem.lastCompletedAt)
		const now = new Date()
		const daysSince = Math.floor((now.getTime() - lastDone.getTime()) / (1000 * 60 * 60 * 24))
		return daysSince >= periodLengthInDays && daysSince < periodLengthInDays + graceDays
	})

	function getMilestoneIcon(streak: number): string | null {
		if (streak >= 365) return 'crown'
		if (streak >= 180) return 'gem'
		if (streak >= 90) return 'trophy'
		if (streak >= 30) return 'star'
		if (streak >= 7) return 'fire-flame-curved'
		return null
	}
</script>
