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
			<TodoListToolbar
				:isInChangeOrderMode
				:sortMode
				:focusMode
				:canUndo
				:stackSize
				:nextUndoDescription
				@add="toDoListDialog?.openCreate"
				@toggleChangeOrderMode="toggleChangeOrderMode"
				@toggleFocusMode="toggleFocusMode"
				@undo="undo"
			/>
			<DailyRecapCard class="mb-3" />
			<VCard class="rounded-lg flex-fill d-flex flex-column pt-3 pb-2 px-4 px-md-6 px-md-4 px-lg-6">
				<OverdueRenegotiateBanner
					v-if="overdueItems.length >= RENEGOTIATE_THRESHOLD"
					:overdueCount="overdueItems.length"
					:isRenegotiating
					:disabled="isInChangeOrderMode"
					@reschedule="rescheduleOverdue"
					@reviewOneByOne="reviewOverdueOneByOne"
				/>
				<UnscheduledNudgeBanner
					v-if="showUnscheduledNudge"
					:count="unscheduledItems.length"
					@scheduleNow="openFirstUnscheduled"
					@dismiss="unscheduledNudgeDismissed = true"
				/>
				<TodoListTitleBar
					v-model:hideDone="hideDone"
					:isInChangeOrderMode
					:listEntity
					:calibration
					:totalProgress
					:sortMode
					@toggleSortMode="toggleSortMode"
				/>
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
							:isFocused="isFocusItem((item as TodoListItemEntity).id)"
							@delete="deleteItem"
							@edit="toDoListDialog?.openEdit"
							@isDoneChanged="handleIsDoneChange"
							@stepToggled="itemsChanged([$event])"
							@addToPlanner="openAddToPlanner"
							@moveToList="openMoveToList"
							@logTime="openLogTime($event, false)"
							@quickStartTimer="openLogTime($event, false, true)"
							@itemClicked="openLogTime($event, true)"
							@toggleFocus="handleToggleFocus"
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
	import { computed, onMounted, ref } from 'vue'
	import { TodoListItemEntity } from '@/core/todoList/dto/response/TodoListItemEntity.ts'
	import { ToDoListItemRequest } from '@/core/todoList/dto/request/ToDoListItemRequest.ts'
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
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import type { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'
	import type { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import NormalTodoListItem from '@/core/todoList/component/normal/NormalTodoListItem.vue'
	import BaseTodoListLogTimeController from '@/core/todoList/component/BaseTodoListLogTimeController.vue'
	import DailyRecapCard from '@/core/todoList/component/DailyRecapCard.vue'
	import ToDoListItemDialog from '@/core/todoList/component/normal/ToDoListItemDialog.vue'
	import MoveToListForm from '@/core/todoList/component/normal/MoveToListForm.vue'
	import TodoListFilters from '@/core/todoList/component/TodoListFilters.vue'
	import TodoListToolbar from '@/core/todoList/component/TodoListToolbar.vue'
	import OverdueRenegotiateBanner from '@/core/todoList/component/OverdueRenegotiateBanner.vue'
	import UnscheduledNudgeBanner from '@/core/todoList/component/UnscheduledNudgeBanner.vue'
	import TodoListTitleBar from '@/core/todoList/component/TodoListTitleBar.vue'
	import { FOCUS_LIMIT, useTodoListFilters } from '@/core/todoList/composable/useTodoListFilters.ts'
	import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'
	import { useUndoableListCrud } from '@/core/todoList/composable/useUndoableListCrud.ts'
	import { useOverdueRenegotiation } from '@/core/todoList/composable/useOverdueRenegotiation.ts'
	import { useUnscheduledNudge } from '@/core/todoList/composable/useUnscheduledNudge.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useLeisurePairing } from '@/core/todoList/composable/useLeisurePairing.ts'
	import type { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
	import { useEstimateCalibration } from '@/core/todoList/composable/useEstimateCalibration.ts'

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
	const { showErrorSnackbar, showSuccessSnackbar, showSnackbar } = useSnackbar()
	const { showFullScreenLoading } = useLoading()
	const { openDialog } = useDialog()
	const { ensureLoaded: ensureLeisurePairingLoaded, pairingFor } = useLeisurePairing()
	const { ensureLoaded: ensureCalibrationLoaded, calibrationRatio } = useEstimateCalibration()

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
		focusMode,
		availablePriorities,
		displayedItems,
		toggleChangeOrderMode,
		toggleSortMode,
		toggleFocusMode,
		isFocusItem,
		toggleFocusItem,
	} = useTodoListFilters(items)

	const { undo, canUndo, stackSize, nextUndoDescription, pushLogTimeUndo } = useTodoListUndo()

	// Flat-list half of the shared undo-wrapped CRUD. The routine list registers the grouped half
	// against the same operations — see `useUndoableListCrud`.
	const listCrud = useUndoableListCrud<TodoListItemEntity, ToDoListItemRequest>(
		{ createWithResponse, update, deleteEntity, changeDisplayOrder, toggleIsDone, uncheckAll: uncheckAllApi },
		{
			containerOf: id => (items.value.some(item => item.id === id) ? items.value : undefined),
			insert(entity) {
				items.value.push(entity)
				items.value.sort(TodoListItemEntity.frontEndSortFunction())
			},
			// `frontEndSortFunction` orders by priority, not by display order, so it cannot put a
			// restored item back where it was in custom sort mode. Re-reading is what can.
			reinsert: async () => {
				items.value = await fetchAll()
			},
			resync: itemsChanged,
			requestFromEntity: entity => ToDoListItemRequest.fromEntity(entity),
			labelOf: entity => entity.activity.name,
		},
	)

	const { deleteItem, handleOrderChange, handleUncheckAll } = listCrud

	onMounted(async () => {
		showFullScreenLoading()
		void ensureLeisurePairingLoaded()
		items.value = await fetchAll()
		listEntity.value = await fetchByIdNamedList(todoListId)
		void ensureCalibrationLoaded(items.value.map(item => item.activity.id))
	})

	const totalProgress = computed(() => ({
		done: items.value.filter(item => item.isDone).length,
		total: items.value.length,
	}))

	const calibration = computed(() =>
		calibrationRatio(
			items.value
				.filter(item => item.suggestedTime?.isNotZero())
				.map(item => ({ activityId: item.activity.id, suggestedSeconds: item.suggestedTime!.getInSeconds })),
		),
	)

	async function add(toDoListItem: ToDoListItemRequest) {
		const created = await listCrud.add(toDoListItem)
		void ensureCalibrationLoaded([created.activity.id])
	}

	async function quickEditedActivity(id: number) {
		const toDoList = items.value[items.value.findIndex(item => item.id === id)]
		if (toDoList) {
			toDoList.activity = await fetchByIdActivity(id)
			void ensureCalibrationLoaded([toDoList.activity.id])
		}
	}

	async function edit(id: number, toDoListItemRequest: ToDoListItemRequest) {
		const beforeEditEntity = items.value.find(item => item.id === id)
		if (beforeEditEntity) await listCrud.edit(beforeEditEntity, toDoListItemRequest)
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

	async function updateAfterEdit(id: number) {
		const updatedItem = await fetchById(id)
		void ensureCalibrationLoaded([updatedItem.activity.id])
		const index = items.value.findIndex(item => item.id === id)
		if (index === -1) return
		items.value[index] = updatedItem
		// Unconditional: the sort is by priority then id, so re-running it on an unchanged priority
		// is a no-op rather than the reshuffle the old `oldTaskPriorityId` guard was avoiding.
		items.value.sort(TodoListItemEntity.frontEndSortFunction())
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

	function handleToggleFocus(item: TodoListItemEntity) {
		const succeeded = toggleFocusItem(item.id)
		if (!succeeded) {
			showErrorSnackbar(i18n.t('toDoList.focus.capReached', { limit: FOCUS_LIMIT }))
		}
	}

	const { RENEGOTIATE_THRESHOLD, overdueItems, isRenegotiating, rescheduleOverdue, reviewOverdueOneByOne } =
		useOverdueRenegotiation(items, filterDueState, { update, fetchAll })

	const { unscheduledNudgeDismissed, unscheduledItems, showUnscheduledNudge, openFirstUnscheduled } =
		useUnscheduledNudge(
			displayedItems,
			isInChangeOrderMode,
			computed(() => overdueItems.value.length),
			openAddToPlanner,
		)

	function openLogTime(item: TodoListItemEntity, isManual: boolean, autoStart = false) {
		logTimeController.value?.open(
			item.activity.id,
			item.activity.name,
			isManual,
			undefined,
			autoStart && !item.suggestedTime?.isNotZero() ? Time.fromMinutes(10) : (item.suggestedTime ?? undefined),
			item.id,
			autoStart,
		)
	}

	/** A claimed reward is logged without an item id, so the undo label has no task to name itself after. */
	const lastStartedLeisureName = ref<string | null>(null)

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
		const leisureName = lastStartedLeisureName.value
		lastStartedLeisureName.value = null
		pushLogTimeUndo(
			item?.activity.name ?? leisureName ?? '',
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
		await adoptPlannerSlotAsDueDate(request)
	}

	/**
	 * Booking a slot in the planner is what "scheduling" means to the user, but the list reads
	 * `dueDate` — without this the "not scheduled" chip and the header nudge would survive the very
	 * action that resolves them, and the count would never drop. An existing due date is left alone:
	 * that one is a deadline the user chose, not something the planner gets to overwrite.
	 */
	async function adoptPlannerSlotAsDueDate(request: PlannerTaskRequest) {
		const itemId = request.todoListItemId
		if (itemId == null || !request.date) return
		const index = items.value.findIndex(item => item.id === itemId)
		if (index === -1) return
		// Re-read first: the backend may already stamp the date when a planner task links to an item.
		const fresh = await fetchById(itemId)
		items.value[index] = fresh
		if (fresh.dueDate) return
		const updateRequest = ToDoListItemRequest.fromEntity(fresh)
		updateRequest.dueDate = formatDateForApi(request.date)
		updateRequest.dueTime = request.startTime ?? null
		await update(itemId, updateRequest)
		items.value[index] = await fetchById(itemId)
	}

	async function handleIsDoneChange(id: number, forceValue?: boolean) {
		await listCrud.handleIsDoneChange(id, forceValue)
		offerPairedLeisure(id)
	}

	/**
	 * The bundling payoff (Milkman, Minson & Volpp 2014): the reward has to arrive attached to the
	 * completion, not later. It stays a snackbar — non-blocking, dismissible, and it never claims the
	 * reward on the user's behalf. Skipping it on an uncheck matters: this fires on the same handler.
	 */
	function offerPairedLeisure(id: number) {
		const item = items.value.find(listItem => listItem.id === id)
		if (!item?.isDone) return
		const paired = pairingFor(item.pairedLeisureActivityId)
		if (!paired) return
		showSnackbar(i18n.t('toDoList.pairing.earned', { name: paired.activity.name }), {
			color: 'primary',
			// Longer than the 3s default: this one carries an action, and an offer that vanishes
			// before it is read is the same as no offer.
			timeout: 8000,
			actionLabel: i18n.t('toDoList.pairing.startNow'),
			actionCallback: () => startPairedLeisure(paired),
		})
	}

	/**
	 * No `itemId` is passed — the leisure activity is not a todo item, so nothing on the list should
	 * be toggled by logging it. The backlog profile's own duration prefills the timer.
	 */
	function startPairedLeisure(paired: ActivityBacklogProfile) {
		lastStartedLeisureName.value = paired.activity.name
		logTimeController.value?.open(
			paired.activity.id,
			paired.activity.name,
			false,
			undefined,
			paired.durationMinutes > 0 ? Time.fromMinutes(paired.durationMinutes) : undefined,
			undefined,
			true,
		)
	}

	async function itemsChanged(changedItems: number[]) {
		if (changedItems.length === 1 && changedItems[0]) {
			await updateAfterEdit(changedItems[0])
		} else {
			items.value = await fetchAll()
		}
	}
</script>
