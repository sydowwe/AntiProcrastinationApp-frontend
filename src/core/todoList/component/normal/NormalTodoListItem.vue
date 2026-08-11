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
		@isDoneChanged="(id: number, forceValue: boolean) => emits('isDoneChanged', id, forceValue)"
		@stepToggled="emits('stepToggled')"
		@addToPlanner="emits('addToPlanner', $event)"
		@logTime="emits('logTime', $event)"
		@itemClicked="emits('itemClicked', $event)"
	>
		<template #pre-chips>
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
				v-else-if="!toDoListItem.isDone"
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
		</template>
	</BaseTodoListItem>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatToDateWithoutYear } from '@/_common/utils/DateTimeHelper.ts'
	import BaseTodoListItem from '@/core/todoList/component/BaseTodoListItem.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind.ts'
	import { MenuItem } from '@/_common/dto/dto/MenuAction.ts'

	const {
		toDoListItem,
		isInChangeOrderMode = false,
		isDragging = false,
	} = defineProps<{
		toDoListItem: TodoListItemEntity
		isInChangeOrderMode?: boolean
		listId: number
		isDragging?: boolean
	}>()

	const emits = defineEmits<{
		edit: [toDoListItem: TodoListItemEntity]
		delete: [id: number]
		isDoneChanged: [toDoListItem: TodoListItemEntity, forceValue?: boolean]
		stepToggled: []
		addToPlanner: [toDoListItem: TodoListItemEntity]
		logTime: [toDoListItem: TodoListItemEntity]
		itemClicked: [toDoListItem: TodoListItemEntity]
		moveToList: [toDoListItem: TodoListItemEntity]
	}>()

	const i18n = useI18n()

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

	const dueDateChip = computed(() => {
		const { dueDate, dueTime } = toDoListItem
		if (!dueDate) return null
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const due = new Date(dueDate + 'T00:00:00')
		const dayOffset = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY)
		const overdue = dayOffset < 0 && !toDoListItem.isDone

		let label: string
		if (overdue) {
			label =
				dayOffset === -1
					? i18n.t('toDoList.due.yesterday')
					: i18n.t('toDoList.due.daysAgo', { days: -dayOffset })
		} else if (dayOffset === 0) {
			label = i18n.t('toDoList.due.today')
		} else if (dayOffset === 1) {
			label = i18n.t('toDoList.due.tomorrow')
		} else {
			// App-locale formatting (DD.MM.), not the browser's — every other date in the app reads this way.
			label = formatToDateWithoutYear(due)
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
