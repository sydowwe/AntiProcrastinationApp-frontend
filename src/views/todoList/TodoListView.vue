<template>
	<VRow
		class="my-lg-3 my-1"
		justify="center"
	>
		<VCol
			cols="12"
			sm="10"
			md="8"
			lg="4"
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
					:disabled="sortMode === 'priority'"
					prependIcon="arrows-up-down"
					@click="toggleChangeOrderMode"
				>
					{{ isInChangeOrderMode ? 'Finish reordering' : 'Change order' }}
				</VBtn>
			</div>
			<VCard class="mx-auto rounded-lg pt-3 pb-2 d-flex flex-column px-4 px-md-6 px-md-4 px-lg-6">
				<VRow class="pb-2">
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
							{{ sortMode === 'priority' ? 'By priority' : 'Custom order' }}
						</VBtn>
					</VCol>
				</VRow>
				<VChipGroup
					v-if="availablePriorities.length > 1 && !isInChangeOrderMode"
					v-model="filterPriorityIds"
					multiple
					class="mb-1"
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
				<ToDoList
					:kind="ToDoListKind.NORMAL"
					:items="displayedItems"
					:allItems="items"
					:isInChangeOrderMode
					:listId="todoListId"
					:activityIds="items.map(item => item.activity.id)"
					@itemsChanged="itemsChanged"
					@editItem="toDoListDialog?.openEdit"
					@deletedItem="deleteItem"
					@itemsReordered="handleOrderChange"
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
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import type { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { TodoListItemEntity } from '@/dtos/response/todoList/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/dtos/request/todoList/ToDoListItemRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import ToDoList from '../../components/toDoList/ToDoList.vue'
	import ToDoListItemDialog from '../../components/dialogs/toDoList/ToDoListItemDialog.vue'
	import { useI18n } from 'vue-i18n'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useActivityCrud } from '@/api/activity/activityApi.ts'
	import { useTaskPriorityCrud } from '@/api/todoList/taskPriorityApi.ts'
	import { useTodoListCrud } from '@/api/todoList/todoListApi.ts'
	import { useTodoListItemCrud } from '@/api/todoList/todoListItemApi.ts'
	import { hasObjectChanged } from '@/utils/helperMethods.ts'
	import type { TodoListEntity } from '@/dtos/response/todoList/TodoListEntity.ts'

	const props = defineProps<{
		id: string
	}>()

	const todoListId = Number(props.id)

	const { fetchById: fetchByIdActivity } = useActivityCrud()
	const { fetchById: fetchByIdTaskUrgency } = useTaskPriorityCrud()
	const { fetchById: fetchByIdNamedList } = useTodoListCrud()
	const { fetchAll, fetchById, createWithResponse, update, deleteEntity, changeUrgency, changeDisplayOrder } =
		useTodoListItemCrud(todoListId)

	const i18n = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()

	const toDoListDialog = ref<InstanceType<typeof ToDoListItemDialog>>()
	const items = ref([] as TodoListItemEntity[])
	const isInChangeOrderMode = ref(false)
	const listEntity = ref<TodoListEntity | null>(null)

	const hideDone = ref(false)
	const sortMode = ref<'custom' | 'priority'>('custom')
	const filterPriorityIds = ref<number[]>([])

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
		let result = [...items.value]
		if (hideDone.value) result = result.filter(item => !item.isDone)
		if (filterPriorityIds.value.length > 0) {
			result = result.filter(item => filterPriorityIds.value.includes(item.taskPriority.id))
		}
		if (sortMode.value === 'priority') {
			result.sort(TodoListItemEntity.frontEndSortFunction())
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

	function toggleSortMode() {
		sortMode.value = sortMode.value === 'custom' ? 'priority' : 'custom'
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

	async function itemsChanged(changedItems: number[]) {
		if (changedItems.length === 1 && changedItems[0]) {
			await updateAfterEdit(changedItems[0])
		} else {
			items.value = await fetchAll()
		}
	}
</script>
