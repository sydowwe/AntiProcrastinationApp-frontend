<template>
	<BaseTodoListItem
		:kind="ToDoListKind.ROUTINE"
		:listId
		:toDoListItem
		:isInChangeOrderMode
		:isDragging
		:color="toDoListItem.color"
		@edit="emits('edit', $event)"
		@delete="emits('delete', $event)"
		@isDoneChanged="(id: number, forceValue?: boolean) => emits('isDoneChanged', id, forceValue)"
		@stepToggled="emits('stepToggled', $event)"
		@addToPlanner="emits('addToPlanner', $event)"
		@logTime="emits('logTime', $event)"
		@quickStartTimer="emits('quickStartTimer', $event)"
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
					{{
						$t('routineTodoList.streakTooltip', {
							streak: toDoListItem.streak,
							best: toDoListItem.bestStreak,
						})
					}}
					<span v-if="gracePeriodActive">· {{ $t('routineTodoList.gracePeriodActive') }}</span>
				</span>
			</VTooltip>
		</template>
		<template #post-chips>
			<VChip
				v-for="day in toDoListItem.suggestedDays"
				:key="day"
				size="x-small"
				variant="tonal"
				color="neutral-600"
			>
				{{ dayLabels[day] }}
			</VChip>
			<VChip
				v-if="toDoListItem.suggestedDayOfMonth"
				size="x-small"
				variant="tonal"
				color="neutral-600"
				prependIcon="calendar-day"
			>
				{{ $t('routineTodoList.dayOfMonthChip', { day: toDoListItem.suggestedDayOfMonth }) }}
			</VChip>
		</template>
	</BaseTodoListItem>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import BaseTodoListItem from '@/core/todoList/component/BaseTodoListItem.vue'
	import type { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
	import { useDayOfWeekOptions } from '@/_common/composable/general/useDayOfWeekOptions.ts'

	const {
		toDoListItem,
		streakConfig,
		isInChangeOrderMode = false,
		isDragging = false,
	} = defineProps<{
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
		stepToggled: [id: number]
		addToPlanner: [toDoListItem: RoutineTodoListItemEntity]
		logTime: [toDoListItem: RoutineTodoListItemEntity]
		quickStartTimer: [toDoListItem: RoutineTodoListItemEntity]
		itemClicked: [toDoListItem: RoutineTodoListItemEntity]
	}>()

	// Localized short day names, keyed by the `DayOfWeek` the API sends. `DAY_OF_WEEK_SHORT_LABELS`
	// is hardcoded English and is only a non-display fallback — see CLAUDE.md.
	const dayOfWeekOptions = useDayOfWeekOptions()
	const dayLabels = computed(
		() =>
			Object.fromEntries(dayOfWeekOptions.value.map(option => [option.value, option.label])) as Record<
				DayOfWeek,
				string
			>,
	)

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
