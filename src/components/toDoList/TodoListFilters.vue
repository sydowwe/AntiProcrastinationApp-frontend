<template>
	<div
		v-if="!isInChangeOrderMode"
		class="d-flex flex-wrap align-center mb-1"
	>
		<VChipGroup
			v-if="availablePriorities.length > 1"
			v-model="filterPriorityIds"
			multiple
		>
			<VChip
				v-for="p in availablePriorities"
				:key="p.id"
				:value="p.id"
				:color="p.color"
				filter
				size="small"
			>
				{{ p.text }}
			</VChip>
		</VChipGroup>
		<VChipGroup
			:modelValue="filterDueState"
			@update:modelValue="filterDueState = $event ?? null"
		>
			<VChip
				value="overdue"
				color="error"
				filter
				size="small"
				prependIcon="circle-exclamation"
			>
				Overdue
			</VChip>
			<VChip
				value="today"
				color="warning"
				filter
				size="small"
				prependIcon="calendar-day"
			>
				Today
			</VChip>
		</VChipGroup>
		<VChip
			v-if="filterPriorityIds.length > 0 || filterDueState !== null"
			size="small"
			variant="tonal"
			color="secondaryOutline"
			prependIcon="xmark"
			@click="clearFilters"
		>
			{{ $t('toDoList.clearFilters') }}
		</VChip>
	</div>
</template>

<script setup lang="ts">
	import type { TaskPriority } from '@/dtos/response/todoList/TaskPriority.ts'
	import type { DueFilter } from '@/composables/todoList/useTodoListFilters.ts'

	const { isInChangeOrderMode, availablePriorities } = defineProps<{
		isInChangeOrderMode: boolean
		availablePriorities: TaskPriority[]
	}>()
	const filterPriorityIds = defineModel<number[]>('filterPriorityIds', { default: [] })
	const filterDueState = defineModel<DueFilter>('filterDueState', { default: null })

	function clearFilters() {
		filterPriorityIds.value = []
		filterDueState.value = null
	}
</script>
