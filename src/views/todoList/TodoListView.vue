<template>
	<VRow
		class="my-lg-3 my-1"
		justify="center"
	>
		<VCol
			class="d-flex flex-column"
			cols="12"
			sm="10"
			md="8"
			lg="5"
		>
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
					@click="toDoListDialog?.openCreate"
				>
					{{ $t('toDoList.add') }}
				</VBtn>
				<VBtn
					:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
					:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
					:disabled="sortMode !== 'custom'"
					prependIcon="arrows-up-down"
					@click="toggleChangeOrderMode"
				>
					{{ isInChangeOrderMode ? 'Finish reordering' : 'Change order' }}
				</VBtn>
			</div>
			<VCard class="rounded-lg flex-fill d-flex flex-column pt-3 pb-2 px-4 px-md-6 px-md-4 px-lg-6">
				<VRow class="pb-2 flex-grow-0">
					<VCol
						cols="6"
						lg="4"
					>
						<VSwitch
							v-model="hideDone"
							class="ml-2"
							label="Hide done"
							density="compact"
							hideDetails
							color="primary-accent"
							:disabled="isInChangeOrderMode"
						/>
					</VCol>
					<VCol
						cols="12"
						lg="4"
						class="pb-0 pb-md-3 d-flex justify-center"
					>
						<VCardTitle class="pa-0 d-flex align-center ga-2">
							<VIcon
								v-if="listEntity?.icon"
								:icon="listEntity.icon"
								color="primary"
							/>
							<span>{{ listEntity?.name }}</span>
						</VCardTitle>
					</VCol>
					<VCol
						cols="6"
						lg="4"
						class="d-flex align-center justify-end"
					>
						<VBtn
							variant="tonal"
							density="comfortable"
							color="primaryOutline"
							prependIcon="arrow-up-wide-short"
							:disabled="isInChangeOrderMode"
							@click="toggleSortMode"
						>
							{{
								sortMode === 'priority'
									? 'By priority'
									: sortMode === 'dueDate'
										? 'By due date'
										: 'Custom order'
							}}
						</VBtn>
					</VCol>
				</VRow>
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
				<ToDoList
					class="flex-fill"
					:kind="ToDoListKind.NORMAL"
					:items="displayedItems"
					:allItems="items"
					:isInChangeOrderMode
					:listId="todoListId"
					:activityIds="items.map(item => item.activity.id)"
					@itemsChanged="itemsChanged"
					@editItem="toDoListDialog?.openEdit"
					@deletedItem="deleteItem"
					@batchDeletedItems="batchDeleteItems"
					@itemsReordered="handleOrderChange"
					@addToPlanner="openAddToPlanner"
				></ToDoList>
			</VCard>
		</VCol>
	</VRow>
	<ToDoListItemDialog
		ref="toDoListDialog"
		@add="add"
		@edit="edit"
		@quickEditedActivity="quickEditedActivity"
		@changedUrgency="onChangedUrgency"
	></ToDoListItemDialog>
	<PlannerTaskDialog
		showDatePicker
		@create="createPlannerTask"
	/>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import type { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/dtos/request/todoList/ToDoListItemRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import ToDoList from '../../components/toDoList/ToDoList.vue'
	import ToDoListItemDialog from '../../components/dialogs/toDoList/ToDoListItemDialog.vue'
	import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useActivityCrud } from '@/api/activity/activityApi.ts'
	import { useTaskPriorityCrud } from '@/api/todoList/taskPriorityApi.ts'
	import { useTodoListCrud } from '@/api/todoList/todoListApi.ts'
	import { useTodoListItemCrud } from '@/api/todoList/todoListItemApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { hasObjectChanged } from '@/utils/helperMethods.ts'
	import type { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'
	import type { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'

	const props = defineProps<{
		id: string
	}>()
	const route = useRoute()
	const router = useRouter()

	const todoListId = Number(props.id)

	const { fetchById: fetchByIdActivity } = useActivityCrud()
	const { fetchById: fetchByIdTaskUrgency } = useTaskPriorityCrud()
	const { fetchById: fetchByIdNamedList } = useTodoListCrud()
	const { fetchAll, fetchById, createWithResponse, update, deleteEntity, changeUrgency, changeDisplayOrder } =
		useTodoListItemCrud(todoListId)
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const { fetchByDate } = useCalendarQuery()
	const { formatToUsString, usStringToUrlString } = useDateTime()
	const plannerStore = useDayPlannerStore()

	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()

	const toDoListDialog = ref<InstanceType<typeof ToDoListItemDialog>>()
	const items = ref([] as TodoListItemEntity[])
	const isInChangeOrderMode = ref(false)
	const listEntity = ref<TodoListEntity | null>(null)

	type SortMode = 'custom' | 'priority' | 'dueDate'
	type DueFilter = 'overdue' | 'today' | null

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
		const tomorrow = new Date(today)
		tomorrow.setDate(today.getDate() + 1)
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

	onMounted(async () => {
		items.value = await fetchAll()
		listEntity.value = await fetchByIdNamedList(todoListId)
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

	async function handleOrderChange(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) {
		const [movedItem] = items.value.splice(oldIndex, 1)
		if (movedItem) {
			items.value.splice(newIndex, 0, movedItem)
		}
		await changeDisplayOrder(request)
	}

	async function add(toDoListItem: ToDoListItemRequest) {
		const response = await createWithResponse(toDoListItem)
		items.value.push(response)
		items.value.sort(TodoListItemEntity.frontEndSortFunction())
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function quickEditedActivity(id: number) {
		const toDoList = items.value[items.value.findIndex(item => item.id === id)]
		if (toDoList) {
			toDoList.activity = await fetchByIdActivity(id)
		}
	}

	async function edit(id: number, toDoListItemRequest: ToDoListItemRequest) {
		const beforeEditEntity = items.value.find(item => item.id === id)
		if (
			beforeEditEntity &&
			hasObjectChanged(ToDoListItemRequest.fromEntity(beforeEditEntity), toDoListItemRequest)
		) {
			await update(id, toDoListItemRequest)
			await updateAfterEdit(id, beforeEditEntity.taskPriority.id)
			showSuccessSnackbar(i18n.t('successFeedback.edited'))
		}
	}

	async function onChangedUrgency(id: number, taskPriorityId?: number) {
		if (!taskPriorityId) {
			showErrorSnackbar(i18n.t('errorFeedback.noUrgencySelected'))
			return
		}
		changeUrgency(id, taskPriorityId).then(async () => {
			const item = items.value.find(i => i.id === id)
			if (item) {
				item.taskPriority = await fetchByIdTaskUrgency(taskPriorityId)
			}
		})
	}

	async function deleteItem(id: number) {
		await deleteEntity(id)
		const index = items.value.findIndex(item => item.id === id)
		if (index !== -1) {
			items.value.splice(index, 1)
		}
	}

	async function batchDeleteItems(ids: number[]) {
		await Promise.all(ids.map(id => deleteEntity(id)))
		items.value = items.value.filter(item => !ids.includes(item.id))
		showSuccessSnackbar(i18n.t('successFeedback.deleted'))
	}

	async function updateAfterEdit(id: number, oldTaskUrgencyId?: number) {
		const updatedItem = await fetchById(id)
		const index = items.value.findIndex(item => item.id === id)
		if (oldTaskUrgencyId === updatedItem.taskPriority.id) {
			items.value[index] = updatedItem
		} else {
			items.value[index] = updatedItem
			items.value.sort(TodoListItemEntity.frontEndSortFunction())
		}
	}

	function openAddToPlanner(item: TodoListItemEntity) {
		plannerStore.openCreateDialogWithActivity(item.activity.id, item.id)
	}

	async function createPlannerTask(request: PlannerTaskRequest) {
		if (request.date) {
			const dateStr = usStringToUrlString(formatToUsString(request.date))
			const calendar = await fetchByDate(dateStr)
			request.calendarId = calendar.id
		}
		request.date = null
		await createPlannerTaskWithResponse(request)
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function itemsChanged(changedItems: number[]) {
		if (changedItems.length === 1 && changedItems[0]) {
			await updateAfterEdit(changedItems[0])
		} else {
			items.value = await fetchAll()
		}
	}
</script>
