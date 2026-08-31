<template>
	<div class="d-flex justify-center mb-3 ga-3">
		<VIconBtn
			icon="arrow-left"
			variant="tonal"
			density="comfortable"
			:to="{ name: 'toDoList' }"
		/>
		<VBtn
			class="flex-grow-1"
			color="primary"
			:disabled="isInChangeOrderMode"
			@click="emit('add')"
		>
			{{ $t('toDoList.add') }}
		</VBtn>
		<VBtn
			:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
			:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
			:disabled="sortMode !== 'custom' || focusMode"
			prependIcon="arrows-up-down"
			@click="emit('toggleChangeOrderMode')"
		>
			{{ isInChangeOrderMode ? $t('toDoList.finishReordering') : $t('toDoList.changeOrder') }}
		</VBtn>
		<VBtn
			:color="focusMode ? 'secondary' : 'secondaryOutline'"
			:variant="focusMode ? 'elevated' : 'outlined'"
			:disabled="isInChangeOrderMode"
			prependIcon="star"
			@click="emit('toggleFocusMode')"
		>
			{{ $t('toDoList.focus.toggle') }}
		</VBtn>
		<TodoListUndoBtn
			:canUndo
			:stackSize
			:nextUndoDescription
			@click="emit('undo')"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { SortMode } from '@/core/todoList/composable/useTodoListFilters.ts'
	import TodoListUndoBtn from '@/core/todoList/component/TodoListUndoBtn.vue'

	defineProps<{
		isInChangeOrderMode: boolean
		sortMode: SortMode
		focusMode: boolean
		canUndo: boolean
		stackSize: number
		nextUndoDescription: string | null
	}>()

	const emit = defineEmits<{
		add: []
		toggleChangeOrderMode: []
		toggleFocusMode: []
		undo: []
	}>()
</script>
