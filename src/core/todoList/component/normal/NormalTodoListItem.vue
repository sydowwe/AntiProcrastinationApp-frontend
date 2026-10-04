<template>
	<BaseTodoListItem
		:kind="ToDoListKind.NORMAL"
		:listId
		:toDoListItem
		:isInChangeOrderMode
		:isDragging
		:color="toDoListItem.taskPriority.color"
		:additionalActions
		@edit="emits('edit', $event)"
		@delete="emits('delete', $event)"
		@isDoneChanged="(id: number, forceValue?: boolean) => emits('isDoneChanged', id, forceValue)"
		@stepToggled="emits('stepToggled', $event)"
		@addToPlanner="emits('addToPlanner', $event)"
		@logTime="emits('logTime', $event)"
		@quickStartTimer="emits('quickStartTimer', $event)"
		@itemClicked="emits('itemClicked', $event)"
	>
		<template #pre-chips>
			<VIconBtn
				icon="star"
				:variant="isFocused ? 'elevated' : 'text'"
				:color="isFocused ? 'primary' : 'textMuted'"
				size="x-small"
				:disabled="isInChangeOrderMode"
				:title="focusTitle"
				:aria-label="focusTitle"
				@click.stop="focusClicked"
			/>
			<ChipWithIcon
				v-if="dueDateChip"
				:vColor="dueDateChip.color"
				variant="tonal"
				size="x-small"
				icon="calendar"
			>
				{{ dueDateChip.label }}
			</ChipWithIcon>
			<ChipWithIcon
				v-if="plannedChip"
				vColor="primaryOutline"
				variant="tonal"
				size="x-small"
				icon="calendar-check"
				:title="$t('toDoList.plannedChipTitle')"
				:aria-label="`${$t('toDoList.plannedChipTitle')}: ${plannedChip}`"
			>
				{{ plannedChip }}
			</ChipWithIcon>
			<ChipWithIcon
				v-if="!toDoListItem.isScheduled && !toDoListItem.isDone"
				vColor="neutral-500"
				variant="tonal"
				size="x-small"
				icon="calendar-xmark"
				class="notScheduledChip"
				role="button"
				:tabindex="isInChangeOrderMode ? -1 : 0"
				:title="$t('toDoList.notScheduledHint')"
				:aria-label="`${$t('toDoList.notScheduled')} — ${$t('toDoList.notScheduledHint')}`"
				@click.stop="scheduleClicked"
				@keydown.enter.stop.prevent="scheduleClicked"
				@keydown.space.stop.prevent="scheduleClicked"
			>
				{{ $t('toDoList.notScheduled') }}
			</ChipWithIcon>
			<ChipWithIcon
				v-if="pairedLeisure"
				vColor="secondaryOutline"
				variant="tonal"
				size="x-small"
				icon="gift"
				:title="
					toDoListItem.isDone
						? $t('toDoList.pairing.chipTitleDone', { name: pairedLeisure.activity.name })
						: $t('toDoList.pairing.chipTitle', { name: pairedLeisure.activity.name })
				"
			>
				{{ pairedLeisure.activity.name }}
			</ChipWithIcon>
		</template>
	</BaseTodoListItem>
</template>

<script setup lang="ts">
	import { computed, onMounted } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatToDateWithoutYear } from '@/_common/utils/DateTimeHelper.ts'
	import BaseTodoListItem from '@/core/todoList/component/BaseTodoListItem.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import { MenuItem } from '@/_common/dto/dto/MenuAction.ts'
	import { useLeisurePairing } from '@/core/todoList/composable/useLeisurePairing.ts'
	import { startOfUserDayPlus } from '@/core/todoList/composable/todayBoundary.ts'

	const {
		toDoListItem,
		isInChangeOrderMode = false,
		isDragging = false,
		isFocused = false,
	} = defineProps<{
		toDoListItem: TodoListItemEntity
		isInChangeOrderMode?: boolean
		listId: number
		isDragging?: boolean
		isFocused?: boolean
	}>()

	const emits = defineEmits<{
		edit: [toDoListItem: TodoListItemEntity]
		delete: [id: number]
		isDoneChanged: [id: number, forceValue?: boolean]
		stepToggled: [id: number]
		addToPlanner: [toDoListItem: TodoListItemEntity]
		logTime: [toDoListItem: TodoListItemEntity]
		quickStartTimer: [toDoListItem: TodoListItemEntity]
		itemClicked: [toDoListItem: TodoListItemEntity]
		moveToList: [toDoListItem: TodoListItemEntity]
		toggleFocus: [toDoListItem: TodoListItemEntity]
	}>()

	const i18n = useI18n()

	// Every item asks, but the composable shares one in-flight request across the whole list.
	const { ensureLoaded: ensureLeisurePairingLoaded, pairingFor } = useLeisurePairing()
	onMounted(ensureLeisurePairingLoaded)

	const pairedLeisure = computed(() => pairingFor(toDoListItem.pairedLeisureActivityId))

	const MS_PER_DAY = 86_400_000

	const additionalActions = [
		new MenuItem('moveToList', 'outlined', 'primaryOutline', 'arrow-right-arrow-left', function () {
			emits('moveToList', toDoListItem)
		}),
	]

	// The chip is the whole point of the schedule-first framing, so it has to be reachable by
	// keyboard as well — and it must stay inert while the list is being reordered, where every
	// other item interaction is disabled too.
	function scheduleClicked() {
		if (isInChangeOrderMode) return
		emits('addToPlanner', toDoListItem)
	}

	const focusTitle = computed(() => (isFocused ? i18n.t('toDoList.focus.unmark') : i18n.t('toDoList.focus.mark')))

	function focusClicked() {
		if (isInChangeOrderMode) return
		emits('toggleFocus', toDoListItem)
	}

	/**
	 * Days from the user's today to a `YYYY-MM-DD` calendar day. Local midnight of the *user's* today:
	 * "which day is it now" is an instant read, while the day is parsed at browser-local midnight —
	 * both are browser-local-field Dates, so the subtraction stays exact.
	 */
	function dayOffsetOf(day: Date): number {
		return Math.round((day.getTime() - startOfUserDayPlus(0).getTime()) / MS_PER_DAY)
	}

	/** Today / Tomorrow / DD.MM. — app-locale formatting, not the browser's, as every other date reads. */
	function upcomingDayLabel(day: Date, dayOffset: number): string {
		if (dayOffset === 0) return i18n.t('toDoList.due.today')
		if (dayOffset === 1) return i18n.t('toDoList.due.tomorrow')
		return formatToDateWithoutYear(day)
	}

	/**
	 * When the item is next planned in the day planner — its schedule, beside (not instead of) the
	 * deadline chip. The server only reports blocks from the user's today on, so this is never past.
	 */
	const plannedChip = computed(() => {
		const slot = toDoListItem.nextPlannedSlot
		if (!slot || toDoListItem.isDone) return null
		const day = new Date(slot.date + 'T00:00:00')
		return `${upcomingDayLabel(day, dayOffsetOf(day))} ${Time.getString(slot.startTime)}`
	})

	const dueDateChip = computed(() => {
		const { dueDate, dueTime } = toDoListItem
		if (!dueDate) return null
		const due = new Date(dueDate + 'T00:00:00')
		const dayOffset = dayOffsetOf(due)
		const overdue = dayOffset < 0 && !toDoListItem.isDone

		let label: string
		if (overdue) {
			label =
				dayOffset === -1
					? i18n.t('toDoList.due.yesterday')
					: i18n.t('toDoList.due.daysAgo', { days: -dayOffset })
		} else {
			label = upcomingDayLabel(due, dayOffset)
		}
		if (dueTime) label += ' ' + Time.getString(dueTime)

		// Strong colour is reserved for dates the user can still act on. A date in the past gets a
		// muted chip and nothing else — a pile of red only makes the list harder to open.
		let color: string | undefined
		if (overdue) color = 'textMuted'
		else if (dayOffset === 0) color = 'warning'
		else if (dayOffset === 1) color = 'primaryOutline'

		return { label, color, overdue }
	})
</script>

<style scoped>
	.notScheduledChip {
		cursor: pointer;
	}

	.notScheduledChip:hover {
		opacity: 0.85;
	}

	.notScheduledChip:focus-visible {
		outline: 2px solid rgb(var(--v-theme-primary-accent));
		outline-offset: 1px;
	}
</style>
