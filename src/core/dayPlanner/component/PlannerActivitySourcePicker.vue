<template>
	<div class="d-flex flex-column ga-3">
		<MyBtnToggle
			v-model="pickerMode"
			:label="$t('planner.a11y.activitySource')"
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
				{{ $t('planner.misc.allActivities') }}
			</VBtn>
			<VBtn
				v-if="showTodo"
				value="todo"
				prependIcon="list-check"
				class="px-1 px-md-2 flex-grow-1"
			>
				{{ $t('planner.misc.toDoListMode') }}
			</VBtn>
			<VBtn
				v-if="showRoutine"
				value="routine"
				prependIcon="rotate"
				class="px-1 px-md-2 flex-grow-1"
			>
				{{ $t('planner.template.routine') }}
			</VBtn>
		</MyBtnToggle>

		<template v-if="pickerMode === 'todo'">
			<div class="mb-2 d-flex ga-3">
				<VAutocomplete
					v-model="filterListId"
					:items="todoLists"
					itemValue="id"
					itemTitle="name"
					:label="$t('planner.misc.listLabel')"
					clearable
					prependIcon="filter"
					density="compact"
					hideDetails
					class="flex-1-1"
				/>
				<VIdAutocomplete
					v-model="filterPriorityId"
					:items="priorities"
					:label="$t('planner.misc.priorityLabel')"
					clearable
					density="compact"
					hideDetails
					class="flex-1-1"
				/>
			</div>
			<VAutocomplete
				v-model="selectedTodoItemId"
				:items="filteredTodoEntries"
				itemTitle="title"
				itemValue="id"
				:itemProps="(entry: TodoPickerEntry) => ({ subtitle: entry.subtitle })"
				:label="$t('planner.misc.selectActivityLabel')"
				clearable
				density="comfortable"
				:loading="loadingTodo"
				:noDataText="$t('planner.misc.noTasksFound')"
				required
				:rules="[(v: unknown) => v !== null || $t('planner.misc.pleaseSelectTask')]"
			/>
		</template>

		<template v-if="pickerMode === 'routine'">
			<VIdAutocomplete
				class="mb-2"
				v-model="filterPeriodId"
				:items="routinePeriods"
				:label="$t('planner.misc.periodLabel')"
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
				:label="$t('planner.misc.selectActivityLabel')"
				clearable
				density="comfortable"
				:loading="loadingRoutine"
				:noDataText="$t('planner.misc.noTasksFound')"
				required
				:rules="[(v: unknown) => v !== null || $t('planner.misc.pleaseSelectTask')]"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import type { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'
	import type { TaskPriority } from '@/core/todoList/dto/response/TaskPriority.ts'
	import { useTodoListCrud } from '@/core/todoList/api/todoListApi.ts'
	import { fetchTodoListItems } from '@/core/todoList/api/todoListItemApi.ts'
	import { useTaskPriorityCrud } from '@/core/todoList/api/taskPriorityApi.ts'
	import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
	import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
	import type { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const {
		showTodo = false,
		showRoutine = true,
		initialActivityId,
		initialTodoListItemId,
	} = defineProps<{
		showTodo?: boolean
		showRoutine?: boolean
		initialActivityId?: number
		/**
		 * The exact to-do item the dialog was opened from ("add to planner" on a row). Takes precedence
		 * over `initialActivityId` in to-do mode: the same activity can sit on several lists, and
		 * matching by activity pre-selected whichever list's item came first — which then became the
		 * task's link, so completing the task ticked a to-do item the user never planned.
		 */
		initialTodoListItemId?: number
	}>()

	const emit = defineEmits<{
		selected: [activityId: number, todoListItemId?: number, suggestedTime?: Time]
	}>()

	const pickerMode = defineModel<'all' | 'todo' | 'routine'>('pickerMode', { default: 'all' })

	/**
	 * One offered to-do item. The picker offers **items**, not activities: the selection becomes the
	 * planner task's link, and completing a linked task ticks exactly that item — so two lists carrying
	 * the same activity are two different choices, and the list is what tells them apart.
	 */
	interface TodoPickerEntry {
		id: number
		/** The activity, plus its list when another offered list carries the same activity. */
		title: string
		/** The list, as the dropdown row's second line — unless `title` already names it. */
		subtitle: string | undefined
		item: TodoListItemEntity
	}

	// To-do list mode state
	const todoLists = ref<TodoListEntity[]>([])
	const priorities = ref<TaskPriority[]>([])
	const allTodoEntries = ref<TodoPickerEntry[]>([])
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

	const filteredTodoEntries = computed(() => {
		if (filterPriorityId.value == null) return allTodoEntries.value
		return allTodoEntries.value.filter(entry => entry.item.taskPriority.id === filterPriorityId.value)
	})

	const filteredRoutineItems = computed(() => {
		if (filterPeriodId.value == null) return allRoutineItems.value
		return allRoutineItems.value.filter(item => item.timePeriod.id === filterPeriodId.value)
	})

	/**
	 * One request per list: `GET /todo-list-item` requires a `todoListId` and no longer serves every item the
	 * user owns in one unpaged read (backend PERF-1). The response carries no list id, which is why each
	 * item is labelled with the list it was fetched for rather than one it reports itself.
	 *
	 * Every item is offered. This used to dedupe by activity, keeping whichever list's item came first —
	 * harmless while the link never reached the server, and wrong once it did: picking "Deep Clean
	 * Kitchen" could link the task to that activity's item on a list the user was not thinking of.
	 */
	async function loadTodoEntriesFor(lists: TodoListEntity[]): Promise<TodoPickerEntry[]> {
		const itemArrays = await Promise.all(lists.map(list => fetchTodoListItems(list.id)))
		const rows = lists.flatMap((list, index) =>
			(itemArrays[index] ?? []).map(item => ({ item, listName: list.name })),
		)
		const listsPerActivity = new Map<number, number>()
		for (const { item } of rows) {
			listsPerActivity.set(item.activity.id, (listsPerActivity.get(item.activity.id) ?? 0) + 1)
		}
		return rows.map(({ item, listName }) => {
			// In the title only where it is needed to tell two rows apart: the selected value shows the
			// title alone, so an ambiguous one would hide which list the task is about to be linked to.
			// Every row names its list exactly once, one way or the other.
			const ambiguous = (listsPerActivity.get(item.activity.id) ?? 0) > 1
			return {
				id: item.id,
				title: ambiguous ? `${item.activity.name} · ${listName}` : item.activity.name,
				subtitle: ambiguous ? undefined : listName,
				item,
			}
		})
	}

	/**
	 * The exact item when the dialog was opened from one. With only an activity to go on, a selection is
	 * made only when a single item carries it — with two, picking one would be a guess about which item
	 * completing this task should tick, and the user is the one who knows.
	 */
	function initialTodoEntry(): TodoPickerEntry | undefined {
		const exact = allTodoEntries.value.find(entry => entry.id === initialTodoListItemId)
		if (exact || initialActivityId == null) return exact
		const byActivity = allTodoEntries.value.filter(entry => entry.item.activity.id === initialActivityId)
		return byActivity.length === 1 ? byActivity[0] : undefined
	}

	async function loadTodoData() {
		loadingTodo.value = true
		try {
			const [lists, prioList] = await Promise.all([fetchFilteredSorted(false, null, null), fetchAllPriorities()])
			todoLists.value = lists
			priorities.value = prioList
			allTodoEntries.value = await loadTodoEntriesFor(lists)
			const match = initialTodoEntry()
			if (match) selectedTodoItemId.value = match.id
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
			// Clearing the filter means "all lists", which is now every list asked for by id rather than one
			// unfiltered call — the same fan-out the initial load already did.
			const lists =
				filterListId.value != null
					? todoLists.value.filter(list => list.id === filterListId.value)
					: todoLists.value
			allTodoEntries.value = await loadTodoEntriesFor(lists)
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
			const entry = allTodoEntries.value.find(candidate => candidate.id === id)
			if (entry) emit('selected', entry.item.activity.id, entry.id)
		}
	})

	watch(selectedRoutineItemId, id => {
		if (id != null) {
			const item = allRoutineItems.value.find(i => i.id === id)
			if (item) emit('selected', item.activity.id, undefined, item.suggestedTime ?? undefined)
		}
	})
</script>
