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
				<TodoListUndoBtn
					:canUndo
					:stackSize
					:nextUndoDescription
					@click="undo"
				/>
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
					@uncheckAll="handleUncheckAll"
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
							@moveToList="openMoveToList"
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
		@logTimeCreated="onLogTimeCreated"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
	import { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind'
	import BaseToDoList from '@/core/todoList/component/BaseToDoList.vue'
	import PlannerTaskDialog from '@/core/dayPlanner/component/normal/PlannerTaskDialog.vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useTaskPriorityCrud } from '@/core/todoList/api/taskPriorityApi.ts'
	import { useTodoListCrud } from '@/core/todoList/api/todoListApi.ts'
	import { useTodoListItemCrud } from '@/core/todoList/api/todoListItemApi.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { hasObjectChanged } from '@/_common/utils/helperMethods.ts'
	import type { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'
	import type { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import NormalTodoListItem from '@/core/todoList/component/normal/NormalTodoListItem.vue'
	import BaseTodoListLogTimeController from '@/core/todoList/component/BaseTodoListLogTimeController.vue'
	import ToDoListItemDialog from '@/core/todoList/component/normal/ToDoListItemDialog.vue'
	import MoveToListForm from '@/core/todoList/component/normal/MoveToListForm.vue'
	import TodoListFilters from '@/core/todoList/component/TodoListFilters.vue'
	import TodoListUndoBtn from '@/core/todoList/component/TodoListUndoBtn.vue'
	import { useTodoListFilters } from '@/core/todoList/composable/useTodoListFilters.ts'
	import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'

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
		moveToList,
		toggleIsDone,
		uncheckAll: uncheckAllApi,
	} = useTodoListItemCrud(todoListId)
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const plannerStore = useDayPlannerStore()

	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { showFullScreenLoading } = useLoading()
	const { openDialog } = useDialog()

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

	const {
		undo,
		canUndo,
		stackSize,
		nextUndoDescription,
		pushDeleteUndo,
		pushUncheckAllUndo,
		pushReorderUndo,
		pushEditUndo,
		pushLogTimeUndo,
	} = useTodoListUndo()

	onMounted(async () => {
		showFullScreenLoading()
		items.value = await fetchAll()
		listEntity.value = await fetchByIdNamedList(todoListId)
	})

	async function handleOrderChange(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) {
		const movedItem = items.value[oldIndex]
		if (!movedItem) return
		const originalPrecedingId = oldIndex > 0 ? (items.value[oldIndex - 1]?.id ?? null) : null
		const originalFollowingId = oldIndex < items.value.length - 1 ? (items.value[oldIndex + 1]?.id ?? null) : null
		const [moved] = items.value.splice(oldIndex, 1)
		items.value.splice(newIndex, 0, moved!)
		await changeDisplayOrder(request)
		const reverseRequest = new ChangeDisplayOrderRequest(movedItem.id, originalPrecedingId, originalFollowingId)
		pushReorderUndo(movedItem.activity.name, async () => {
			await changeDisplayOrder(reverseRequest)
			items.value = await fetchAll()
		})
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
			const savedRequest = ToDoListItemRequest.fromEntity(beforeEditEntity)
			await update(id, toDoListItemRequest)
			await updateAfterEdit(id, beforeEditEntity.taskPriority.id)
			showSuccessSnackbar(i18n.t('successFeedback.edited'))
			pushEditUndo(beforeEditEntity.activity.name, async () => {
				await update(id, savedRequest)
				await updateAfterEdit(id)
			})
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
		const savedItem = items.value.find(item => item.id === id)
		const savedIndex = items.value.findIndex(item => item.id === id)
		if (!savedItem || savedIndex === -1) return
		const precedingId = savedIndex > 0 ? (items.value[savedIndex - 1]?.id ?? null) : null
		const followingId = savedIndex < items.value.length - 1 ? (items.value[savedIndex + 1]?.id ?? null) : null
		await deleteEntity(id)
		items.value.splice(savedIndex, 1)
		pushDeleteUndo(savedItem.activity.name, async () => {
			const restored = await createWithResponse(ToDoListItemRequest.fromEntity(savedItem))
			await changeDisplayOrder(new ChangeDisplayOrderRequest(restored.id, precedingId, followingId))
			items.value = await fetchAll()
		})
	}

	async function handleUncheckAll(doneIds: number[]) {
		await uncheckAllApi(doneIds)
		await itemsChanged(doneIds)
		pushUncheckAllUndo(doneIds.length, async () => {
			for (const id of doneIds) await toggleIsDone(id, true)
			items.value = await fetchAll()
		})
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

	async function openMoveToList(item: TodoListItemEntity) {
		const result = await openDialog<{ destinationListId: number }>({
			component: MoveToListForm,
			componentProps: { currentListId: todoListId },
			dialogProps: {
				title: i18n.t('toDoList.moveToList'),
			},
		})
		if (!result) return
		await moveItemToList(item.id, result.destinationListId)
	}

	async function moveItemToList(itemId: number, destinationListId: number) {
		await moveToList(itemId, destinationListId)
		const index = items.value.findIndex(item => item.id === itemId)
		if (index !== -1) {
			items.value.splice(index, 1)
		}
		showSuccessSnackbar(i18n.t('successFeedback.moved'))
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

	function onLogTimeCreated({
		historyRecordId,
		itemId,
		itemWasCompleted,
	}: {
		historyRecordId: number
		itemId: number | undefined
		itemWasCompleted: boolean
	}) {
		const item = itemId !== undefined ? items.value.find(i => i.id === itemId) : undefined
		pushLogTimeUndo(
			item?.activity.name ?? '',
			historyRecordId,
			itemWasCompleted && itemId !== undefined
				? async () => {
						await toggleIsDone(itemId, false)
						await itemsChanged([itemId])
					}
				: undefined,
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
