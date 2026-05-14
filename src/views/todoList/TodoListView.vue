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
					{{ isInChangeOrderMode ? $t('toDoList.finishReordering') : $t('toDoList.changeOrder') }}
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
							:label="$t('toDoList.hideDone')"
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
									? $t('toDoList.sortByPriority')
									: sortMode === 'dueDate'
										? $t('toDoList.sortByDueDate')
										: $t('toDoList.sortCustom')
							}}
						</VBtn>
					</VCol>
				</VRow>
				<TodoListFilters
					v-model:filterPriorityIds="filterPriorityIds"
					v-model:filterDueState="filterDueState"
					:isInChangeOrderMode
					:availablePriorities
				/>
				<BaseToDoList
					class="flex-fill"
					:kind="ToDoListKind.NORMAL"
					:items="displayedItems"
					:allItems="items"
					:isInChangeOrderMode
					:listId="todoListId"
					:activityIds="items.map(item => item.activity.id)"
					@itemsReordered="handleOrderChange"
					@uncheckAll="uncheckAll"
				>
					<template #default="{ item, isDragging }">
						<NormalTodoListItem
							:toDoListItem="item as TodoListItemEntity"
							:isInChangeOrderMode
							:listId="todoListId"
							:isDragging="isDragging"
							@delete="deleteItem"
							@edit="toDoListDialog?.openEdit"
							@isDoneChanged="handleIsDoneChange"
							@stepToggled="itemsChanged"
							@addToPlanner="openAddToPlanner"
							@logTime="openLogTime($event, false)"
							@itemClicked="openLogTime($event, true)"
						/>
					</template>
				</BaseToDoList>
			</VCard>
		</VCol>
	</VRow>
	<ToDoListItemDialog
		ref="toDoListDialog"
		@add="add"
		@edit="edit"
		@quickEditedActivity="quickEditedActivity"
		@changedPriority="onChangedPriority"
	></ToDoListItemDialog>
	<PlannerTaskDialog
		showDatePicker
		@create="createPlannerTask"
	/>
	<BaseTodoListLogTimeController
		ref="logTimeController"
		:kind="ToDoListKind.NORMAL"
		@itemsChanged="itemsChanged"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import type { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/dtos/request/todoList/ToDoListItemRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import BaseToDoList from '../../components/toDoList/BaseToDoList.vue'
	import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { useActivityCrud } from '@/api/activity/activityApi.ts'
	import { useTaskPriorityCrud } from '@/api/todoList/taskPriorityApi.ts'
	import { useTodoListCrud } from '@/api/todoList/todoListApi.ts'
	import { useTodoListItemCrud } from '@/api/todoList/todoListItemApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { hasObjectChanged } from '@/utils/helperMethods.ts'
	import type { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'
	import type { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import NormalTodoListItem from '@/components/toDoList/normal/NormalTodoListItem.vue'
	import BaseTodoListLogTimeController from '@/components/toDoList/BaseTodoListLogTimeController.vue'
	import ToDoListItemDialog from '@/components/toDoList/normal/ToDoListItemDialog.vue'
	import TodoListFilters from '@/components/toDoList/TodoListFilters.vue'
	import { useTodoListFilters } from '@/composables/todoList/useTodoListFilters.ts'

	const props = defineProps<{
		id: string
	}>()

	const todoListId = Number(props.id)

	const { fetchById: fetchByIdActivity } = useActivityCrud()
	const { fetchById: fetchByIdTaskPriority } = useTaskPriorityCrud()
	const { fetchById: fetchByIdNamedList } = useTodoListCrud()
	const {
		fetchAll,
		fetchById,
		createWithResponse,
		update,
		deleteEntity,
		changePriority,
		changeDisplayOrder,
		toggleIsDone,
		uncheckAll,
	} = useTodoListItemCrud(todoListId)
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const plannerStore = useDayPlannerStore()

	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { showFullScreenLoading } = useLoading()

	const toDoListDialog = ref<InstanceType<typeof ToDoListItemDialog>>()
	const logTimeController = ref<InstanceType<typeof BaseTodoListLogTimeController>>()
	const items = ref([] as TodoListItemEntity[])
	const listEntity = ref<TodoListEntity | null>(null)

	const {
		isInChangeOrderMode,
		hideDone,
		sortMode,
		filterPriorityIds,
		filterDueState,
		availablePriorities,
		displayedItems,
		toggleChangeOrderMode,
		toggleSortMode,
	} = useTodoListFilters(items)

	onMounted(async () => {
		showFullScreenLoading()
		items.value = await fetchAll()
		listEntity.value = await fetchByIdNamedList(todoListId)
	})

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

	async function onChangedPriority(id: number, taskPriorityId?: number) {
		if (!taskPriorityId) {
			showErrorSnackbar(i18n.t('errorFeedback.noPrioritySelected'))
			return
		}
		changePriority(id, taskPriorityId).then(async () => {
			const item = items.value.find(i => i.id === id)
			if (item) {
				item.taskPriority = await fetchByIdTaskPriority(taskPriorityId)
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

	async function updateAfterEdit(id: number, oldTaskPriorityId?: number) {
		const updatedItem = await fetchById(id)
		const index = items.value.findIndex(item => item.id === id)
		if (oldTaskPriorityId === updatedItem.taskPriority.id) {
			items.value[index] = updatedItem
		} else {
			items.value[index] = updatedItem
			items.value.sort(TodoListItemEntity.frontEndSortFunction())
		}
	}

	function openAddToPlanner(item: TodoListItemEntity) {
		plannerStore.openCreateDialogWithActivity(item.activity.id, item.id, 'todo', item.suggestedTime ?? undefined)
	}

	function openLogTime(item: TodoListItemEntity, isManual: boolean) {
		logTimeController.value?.open(
			item.activity.id,
			item.activity.name,
			isManual,
			undefined,
			item.suggestedTime ?? undefined,
			item.id,
		)
	}

	async function createPlannerTask(request: PlannerTaskRequest) {
		await createPlannerTaskWithResponse(request)
		showSuccessSnackbar(i18n.t('successFeedback.added'))
	}

	async function handleIsDoneChange(id: number, forceValue: boolean) {
		await toggleIsDone(id, forceValue)
		await itemsChanged([id])
	}

	async function itemsChanged(changedItems: number[]) {
		if (changedItems.length === 1 && changedItems[0]) {
			await updateAfterEdit(changedItems[0])
		} else {
			items.value = await fetchAll()
		}
	}
</script>
