import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Ref } from 'vue'
import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'

export type SortMode = 'custom' | 'priority' | 'dueDate'
export type DueFilter = 'overdue' | 'today' | null

export function useTodoListFilters(items: Ref<TodoListItemEntity[]>) {
	const route = useRoute()
	const router = useRouter()

	const isInChangeOrderMode = ref(false)

	const hideDone = computed({
		get: () => route.query.hideDone === 'true',
		set: val => router.replace({ query: { ...route.query, hideDone: val ? 'true' : undefined } }),
	})

	const sortMode = computed({
		get: () => (route.query.sort as SortMode) || 'custom',
		set: (val: SortMode) => router.replace({ query: { ...route.query, sort: val === 'custom' ? undefined : val } }),
	})

	const filterPriorityIds = computed({
		get: (): number[] => {
			const val = route.query.priorities
			if (!val) return []
			return (Array.isArray(val) ? val : [val]).map(Number)
		},
		set: (val: number[]) =>
			router.replace({
				query: { ...route.query, priorities: val.length ? val.map(String) : undefined },
			}),
	})

	const filterDueState = computed({
		get: () => (route.query.due as DueFilter) ?? null,
		set: (val: DueFilter) => router.replace({ query: { ...route.query, due: val ?? undefined } }),
	})

	const availablePriorities = computed(() => {
		const seen = new Map<number, TodoListItemEntity['taskPriority']>()
		for (const item of items.value) {
			if (!seen.has(item.taskPriority.id)) {
				seen.set(item.taskPriority.id, item.taskPriority)
			}
		}
		return Array.from(seen.values()).sort((a, b) => a.priority - b.priority)
	})

	const displayedItems = computed(() => {
		if (isInChangeOrderMode.value) return items.value
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		let result = [...items.value]
		if (hideDone.value) result = result.filter(item => !item.isDone)
		if (filterPriorityIds.value.length > 0) {
			result = result.filter(item => filterPriorityIds.value.includes(item.taskPriority.id))
		}
		if (filterDueState.value === 'overdue') {
			result = result.filter(item => {
				if (!item.dueDate || item.isDone) return false
				return new Date(item.dueDate + 'T00:00:00') < today
			})
		} else if (filterDueState.value === 'today') {
			result = result.filter(item => {
				if (!item.dueDate) return false
				return new Date(item.dueDate + 'T00:00:00').getTime() === today.getTime()
			})
		}
		if (sortMode.value === 'priority') {
			result.sort(TodoListItemEntity.frontEndSortFunction())
		} else if (sortMode.value === 'dueDate') {
			result.sort((a, b) => {
				if (!a.dueDate && !b.dueDate) return 0
				if (!a.dueDate) return 1
				if (!b.dueDate) return -1
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
			})
		}
		return result
	})

	function toggleChangeOrderMode() {
		isInChangeOrderMode.value = !isInChangeOrderMode.value
	}

	function clearFilters() {
		filterPriorityIds.value = []
		filterDueState.value = null
	}

	function toggleSortMode() {
		const modes: SortMode[] = ['custom', 'priority', 'dueDate']
		const next = modes[(modes.indexOf(sortMode.value) + 1) % modes.length]
		sortMode.value = next
	}

	return {
		isInChangeOrderMode,
		hideDone,
		sortMode,
		filterPriorityIds,
		filterDueState,
		availablePriorities,
		displayedItems,
		toggleChangeOrderMode,
		clearFilters,
		toggleSortMode,
	}
}
