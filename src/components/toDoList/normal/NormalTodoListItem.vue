<template>
	<BaseTodoListItem
		:kind="ToDoListKind.NORMAL"
		:listId
		:toDoListItem
		:isInChangeOrderMode
		:isDragging
		:color="toDoListItem.taskPriority.color"
		:isOverdue="dueDateChip?.overdue ?? false"
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
		</template>
		<template #post-chips>
			<VIcon
				v-if="dueDateChip?.overdue"
				icon="triangle-exclamation"
				color="error"
				size="14"
				class="mb-1"
			/>
		</template>
	</BaseTodoListItem>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import type { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import BaseTodoListItem from '@/components/toDoList/BaseTodoListItem.vue'
	import ChipWithIcon from '@/components/general/ChipWithIcon.vue'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'

	const { toDoListItem, isInChangeOrderMode = false, isDragging = false } = defineProps<{
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
	}>()

	const dueDateChip = computed(() => {
		const { dueDate, dueTime } = toDoListItem
		if (!dueDate) return null
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const due = new Date(dueDate + 'T00:00:00')
		const tomorrow = new Date(today)
		tomorrow.setDate(today.getDate() + 1)
		const overdue = due < today && !toDoListItem.isDone
		const isToday = due.getTime() === today.getTime()
		const isTomorrow = due.getTime() === tomorrow.getTime()
		let label = isToday
			? 'Today'
			: isTomorrow
				? 'Tomorrow'
				: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
		if (dueTime) label += ' ' + Time.getString(dueTime)
		return { label, color: overdue ? 'error' : isToday ? 'warning' : (undefined as string | undefined), overdue }
	})
</script>
