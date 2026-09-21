<template>
	<div
		v-if="!isInChangeOrderMode"
		class="d-flex flex-wrap align-center mb-1"
	>
		<!-- Vuetify's chip is a focusable `span` with no role or state; the roles are ours (F49). -->
		<VChipGroup
			v-if="availablePriorities.length > 1"
			v-model="filterPriorityIds"
			multiple
			role="group"
			:ariaLabel="$t('toDoList.priority')"
		>
			<VChip
				v-for="p in availablePriorities"
				:key="p.id"
				:value="p.id"
				:color="p.color"
				filter
				size="small"
				role="checkbox"
				:ariaChecked="filterPriorityIds.includes(p.id)"
			>
				{{ p.text }}
			</VChip>
		</VChipGroup>
		<VChipGroup
			:modelValue="filterDueState"
			role="radiogroup"
			:ariaLabel="$t('toDoList.dueFilterLabel')"
			@update:modelValue="filterDueState = $event ?? null"
		>
			<VChip
				value="overdue"
				color="textMuted"
				filter
				size="small"
				prependIcon="calendar"
				role="radio"
				:ariaChecked="filterDueState === 'overdue'"
			>
				{{ $t('toDoList.due.pastDue') }}
			</VChip>
			<VChip
				value="today"
				color="warning"
				filter
				size="small"
				prependIcon="calendar-day"
				role="radio"
				:ariaChecked="filterDueState === 'today'"
			>
				{{ $t('toDoList.due.today') }}
			</VChip>
		</VChipGroup>
		<VChip
			v-if="hasActiveFilters"
			size="small"
			variant="tonal"
			color="secondaryOutline"
			prependIcon="xmark"
			role="button"
			@click="emit('clear')"
		>
			{{ $t('toDoList.clearFilters') }}
		</VChip>
	</div>
</template>

<script setup lang="ts">
	import type { TaskPriority } from '@/core/todoList/dto/response/TaskPriority.ts'
	import type { DueFilter } from '@/core/todoList/composable/useTodoListFilters.ts'

	// `hasActiveFilters` and the clearing itself both come from `useTodoListFilters` rather than being
	// re-derived here: this component only sees two of the three filters that "Clear filters" resets
	// ("Hide done" lives in the title bar), and a local copy is how the two drifted apart before.
	const { isInChangeOrderMode, availablePriorities, hasActiveFilters } = defineProps<{
		isInChangeOrderMode: boolean
		availablePriorities: TaskPriority[]
		hasActiveFilters: boolean
	}>()
	const emit = defineEmits<{
		clear: []
	}>()
	const filterPriorityIds = defineModel<number[]>('filterPriorityIds', { default: [] })
	const filterDueState = defineModel<DueFilter>('filterDueState', { default: null })
</script>
