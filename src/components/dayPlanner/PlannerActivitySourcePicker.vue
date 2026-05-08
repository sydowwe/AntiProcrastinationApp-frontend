<template>
	<div class="d-flex flex-column ga-3">
		<VBtnToggle
			v-model="pickerMode"
			mandatory
			density="compact"
			color="primary"
			rounded
			class="w-100 pb-1 mb-2 mt-2"
		>
			<VBtn
				value="all"
				class="px-1 px-md-2 flex-grow-1"
			>
				All activities
			</VBtn>
			<VBtn
				v-if="showTodo"
				value="todo"
				prependIcon="list-check"
				class="px-1 px-md-2 flex-grow-1"
			>
				To-do list
			</VBtn>
			<VBtn
				v-if="showRoutine"
				value="routine"
				prependIcon="rotate"
				class="px-1 px-md-2 flex-grow-1"
			>
				Routine
			</VBtn>
		</VBtnToggle>

		<template v-if="pickerMode === 'todo'">
			<div class="mb-2 d-flex ga-3">
				<VAutocomplete
					v-model="filterListId"
					:items="todoLists"
					itemValue="id"
					itemTitle="name"
					label="List"
					clearable
					prependIcon="filter"
					density="compact"
					hideDetails
					class="flex-1-1"
				/>
				<VIdAutocomplete
					v-model="filterPriorityId"
					:items="priorities"
					label="Priority"
					clearable
					density="compact"
					hideDetails
					class="flex-1-1"
				/>
			</div>
			<VAutocomplete
				v-model="selectedTodoItemId"
				:items="filteredTodoItems"
				:itemTitle="(item: TodoListItemEntity) => item.activity.name"
				itemValue="id"
				label="Select activity"
				clearable
				density="comfortable"
				:loading="loadingTodo"
				noDataText="No tasks found"
				required
				:rules="[(v: unknown) => v !== null || 'Please select a task']"
			/>
		</template>

		<template v-if="pickerMode === 'routine'">
			<VIdAutocomplete
				class="mb-2"
				v-model="filterPeriodId"
				:items="routinePeriods"
				label="Period"
				clearable
				prependIcon="filter"
				density="compact"
				hideDetails
			/>
			<VAutocomplete
				v-model="selectedRoutineItemId"
				:items="filteredRoutineItems"
				:itemTitle="(item: RoutineTodoListItemEntity) => item.activity.name"
				itemValue="id"
				label="Select activity"
				clearable
				density="comfortable"
				:loading="loadingRoutine"
				noDataText="No tasks found"
				required
				:rules="[(v: unknown) => v !== null || 'Please select a task']"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import type { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'
	import type { TaskPriority } from '@/dtos/response/todoList/TaskPriority.ts'
	import { useTodoListCrud } from '@/api/todoList/todoListApi.ts'
	import { fetchTodoListItems } from '@/api/todoList/todoListItemApi.ts'
	import { useTaskPriorityCrud } from '@/api/todoList/taskPriorityApi.ts'
	import { useRoutineTodoListItemCrud } from '@/api/routineTodoList/routineTodoListApi.ts'
	import { useRoutineTimePeriodCrud } from '@/api/routineTodoList/timePeriodApi.ts'
	import type { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'

	const {
		showTodo = false,
		showRoutine = true,
		initialActivityId,
	} = defineProps<{
		showTodo?: boolean
		showRoutine?: boolean
		initialActivityId?: number
	}>()

	const emit = defineEmits<{
		selected: [activityId: number, todoListItemId?: number]
	}>()

	const pickerMode = defineModel<'all' | 'todo' | 'routine'>('pickerMode', { default: 'all' })

	// To-do list mode state
	const todoLists = ref<TodoListEntity[]>([])
	const priorities = ref<TaskPriority[]>([])
	const allTodoItems = ref<TodoListItemEntity[]>([])
	const filterListId = ref<number | null>(null)
	const filterPriorityId = ref<number | null>(null)
	const selectedTodoItemId = ref<number | null>(null)
	const loadingTodo = ref(false)

	// Routine mode state
	const routinePeriods = ref<SelectOption[]>([])
	const allRoutineItems = ref<RoutineTodoListItemEntity[]>([])
	const filterPeriodId = ref<number | null>(null)
	const selectedRoutineItemId = ref<number | null>(null)
	const loadingRoutine = ref(false)

	const { fetchFilteredSorted } = useTodoListCrud()
	const { fetchAll: fetchAllPriorities } = useTaskPriorityCrud()
	const { fetchAll: fetchAllRoutineItems } = useRoutineTodoListItemCrud()
	const { fetchSelectOptions: fetchAllPeriods } = useRoutineTimePeriodCrud()

	const filteredTodoItems = computed(() => {
		if (filterPriorityId.value == null) return allTodoItems.value
		return allTodoItems.value.filter(item => item.taskPriority.id === filterPriorityId.value)
	})

	const filteredRoutineItems = computed(() => {
		if (filterPeriodId.value == null) return allRoutineItems.value
		return allRoutineItems.value.filter(item => item.timePeriod.id === filterPeriodId.value)
	})

	async function loadTodoData() {
		loadingTodo.value = true
		try {
			const [lists, prioList] = await Promise.all([fetchFilteredSorted(false, null, null), fetchAllPriorities()])
			todoLists.value = lists
			priorities.value = prioList
			const itemArrays = await Promise.all(lists.map(list => fetchTodoListItems(list.id)))
			const seen = new Set<number>()
			allTodoItems.value = itemArrays.flat().filter(item => {
				if (seen.has(item.activity.id)) return false
				seen.add(item.activity.id)
				return true
			})
			if (initialActivityId != null) {
				const match = allTodoItems.value.find(item => item.activity.id === initialActivityId)
				if (match) selectedTodoItemId.value = match.id
			}
		} finally {
			loadingTodo.value = false
		}
	}

	async function loadRoutineData() {
		loadingRoutine.value = true
		try {
			routinePeriods.value = await fetchAllPeriods()
			const items = await fetchAllRoutineItems()
			const seenRoutine = new Set<number>()
			allRoutineItems.value = items.filter(item => {
				if (seenRoutine.has(item.activity.id)) return false
				seenRoutine.add(item.activity.id)
				return true
			})
			if (initialActivityId != null) {
				const match = allRoutineItems.value.find(item => item.activity.id === initialActivityId)
				if (match) selectedRoutineItemId.value = match.id
			}
		} finally {
			loadingRoutine.value = false
		}
	}

	async function reloadTodoItems() {
		loadingTodo.value = true
		try {
			allTodoItems.value = await fetchTodoListItems(filterListId.value)
		} finally {
			loadingTodo.value = false
		}
	}

	watch(
		pickerMode,
		async mode => {
			selectedTodoItemId.value = null
			selectedRoutineItemId.value = null
			filterListId.value = null
			filterPriorityId.value = null
			filterPeriodId.value = null
			if (mode === 'todo') await loadTodoData()
			else if (mode === 'routine') await loadRoutineData()
		},
		{ immediate: true },
	)

	watch(filterListId, async () => {
		selectedTodoItemId.value = null
		await reloadTodoItems()
	})

	watch(selectedTodoItemId, id => {
		if (id != null) {
			const item = allTodoItems.value.find(i => i.id === id)
			if (item) emit('selected', item.activity.id, item.id)
		}
	})

	watch(selectedRoutineItemId, id => {
		if (id != null) {
			const item = allRoutineItems.value.find(i => i.id === id)
			if (item) emit('selected', item.activity.id)
		}
	})
</script>
