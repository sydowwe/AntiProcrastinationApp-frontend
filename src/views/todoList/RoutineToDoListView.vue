<template>
	<div class="h-100 pb-4 pt-5 w-100 d-flex flex-column">
		<div
			class="mx-auto w-100 w-lg-66 d-flex flex-column flex-lg-row justify-lg-center ga-3 pb-3 bg-background position-sticky px-3"
			style="top: 0; z-index: 1"
		>
			<div class="d-flex ga-3 align-center">
				<VBtn
					to="/routine-settings"
					prependIcon="gear"
					variant="tonal"
					color="secondaryOutline"
				>
					{{ $t('routineTodoList.settings') }}
				</VBtn>
				<VSelect
					:modelValue="smAndDown ? singleVisibleGroupId : visibleGroupIds"
					:items="groupSelectItems"
					:label="$t('routineTodoList.groups')"
					:multiple="!smAndDown"
					chips
					density="compact"
					hideDetails
					@update:modelValue="onGroupSelectUpdate"
				/>
			</div>
			<div class="d-flex ga-3">
				<VBtn
					class="flex-grow-1"
					color="primary"
					prependIcon="plus"
					:disabled="isInChangeOrderMode"
					@click="toDoListDialog?.openCreate()"
				>
					{{ $t('toDoList.add') }}
				</VBtn>
				<VBtn
					:color="isInChangeOrderMode ? 'secondary' : 'secondaryOutline'"
					:variant="isInChangeOrderMode ? 'elevated' : 'outlined'"
					appendIcon="arrows-up-down"
					@click="toggleChangeOrderMode"
				>
					{{ $t('routineTodoList.reorder') }}
				</VBtn>
				<TodoListUndoBtn
					:canUndo
					:stackSize
					:nextUndoDescription
					@click="undo"
				/>
			</div>
		</div>
		<VRow
			class="flex-grow-1 overflow-hidden ma-0"
			style="min-height: 0"
			justify="center"
			align="start"
		>
			<VCol
				v-for="group in visibleGroups"
				:key="group.timePeriod.id"
				class="pa-2 h-100"
				cols="12"
				:sm="visibleGroups.length >= 2 ? 6 : undefined"
				:md="visibleGroups.length >= 3 ? 4 : undefined"
				:lg="visibleGroups.length >= 4 ? 3 : undefined"
			>
				<RoutineGroupCard
					:group
					:isInChangeOrderMode
					:hideDone="hideDoneGroupIds.includes(group.timePeriod.id as number)"
					@update:hideDone="(val: boolean) => updateHideDone(group.timePeriod.id as number, val)"
					@logTime="openLogTime"
					@addToPlanner="openAddToPlanner"
					@delete="onDelete"
					@edit="toDoListDialog?.openEdit"
					@isDoneChanged="handleIsDoneChange"
					@stepToggled="onItemsChanged"
					@uncheckAll="(doneIds: number[]) => handleUncheckAll(doneIds, group.timePeriod.id as number)"
					@itemsReordered="
						(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) =>
							handleOrderChange(oldIndex, newIndex, request, group.timePeriod.id as number)
					"
					@crossListDrop="handleCrossListDrop"
					@openHistory="openHistoryDialog"
				/>
			</VCol>
		</VRow>
	</div>
	<RoutineToDoListDialog
		ref="toDoListDialog"
		@add="add"
		@edit="edit"
	/>
	<RoutineGroupHistoryDialog ref="historyDialog" />
	<PlannerTaskDialog
		showDatePicker
		@create="createPlannerTask"
	/>
	<BaseTodoListLogTimeController
		ref="logTimeController"
		:kind="ToDoListKind.ROUTINE"
		@itemsChanged="onItemsChanged"
		@logTimeCreated="onLogTimeCreated"
	/>
	<RoutineConfetti
		v-if="showConfetti"
		:key="confettiKey"
	/>
</template>
<script setup lang="ts">
	import RoutineToDoListDialog from '@/components/toDoList/routine/dialog/RoutineToDoListDialog.vue'
	import RoutineConfetti from '@/components/toDoList/routine/RoutineConfetti.vue'
	import RoutineGroupHistoryDialog from '@/components/toDoList/routine/dialog/RoutineGroupHistoryDialog.vue'
	import RoutineGroupCard from '@/components/toDoList/routine/RoutineGroupCard.vue'
	import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
	import BaseTodoListLogTimeController from '@/components/toDoList/BaseTodoListLogTimeController.vue'
	import TodoListUndoBtn from '@/components/toDoList/TodoListUndoBtn.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { RoutineTodoListItemRequest } from '@/dtos/request/todoList/RoutineTodoListItemRequest.ts'
	import { ChangeDisplayOrderRequest } from '@/dtos/request/todoList/ChangeDisplayOrderRequest.ts'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind'
	import { useRoutineTodoListItemCrud } from '@/api/routineTodoList/routineTodoListApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { useTodoListUndo } from '@/composables/todoList/useTodoListUndo.ts'
	import type { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
	import type { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import type { RoutineTodoListGroupedList } from '@/dtos/response/todoList/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/dtos/response/todoList/routine/RoutineTodoListItemEntity.ts'
	import { useDisplay } from 'vuetify/framework'

	const route = useRoute()
	const router = useRouter()
	const { t } = useI18n()
	const { smAndDown } = useDisplay()

	const {
		fetchById,
		createWithResponse,
		update,
		deleteEntity,
		getAllGrouped,
		changeDisplayOrder,
		toggleIsDone,
		uncheckAll: uncheckAllApi,
	} = useRoutineTodoListItemCrud()
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { showFullScreenLoading } = useLoading()
	const plannerStore = useDayPlannerStore()

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

	const groupedItems = ref([] as RoutineTodoListGroupedList[])
	const toDoListDialog = ref<InstanceType<typeof RoutineToDoListDialog>>()
	const historyDialog = ref<InstanceType<typeof RoutineGroupHistoryDialog>>()
	const logTimeController = ref<InstanceType<typeof BaseTodoListLogTimeController>>()
	const isInChangeOrderMode = ref(false)

	const showConfetti = ref(false)
	const confettiKey = ref(0)
	const celebratedGroupIds = new Set<number>()

	function triggerConfetti() {
		confettiKey.value++
		showConfetti.value = true
		setTimeout(() => {
			showConfetti.value = false
		}, 2500)
	}

	const hideDoneGroupIds = computed({
		get: (): number[] => {
			const val = route.query.hideDone
			if (!val) return []
			return (Array.isArray(val) ? val : [val]).map(Number)
		},
		set: (val: number[]) =>
			router.replace({ query: { ...route.query, hideDone: val.length ? val.map(String) : undefined } }),
	})

	function updateHideDone(groupId: number, val: boolean) {
		const current = hideDoneGroupIds.value
		if (val) {
			hideDoneGroupIds.value = current.includes(groupId) ? current : [...current, groupId]
		} else {
			hideDoneGroupIds.value = current.filter(id => id !== groupId)
		}
	}

	const groupSelectItems = computed(() =>
		groupedItems.value.map(g => ({ title: g.timePeriod.text, value: g.timePeriod.id as number })),
	)

	const visibleGroupIds = computed(() =>
		groupedItems.value.filter(g => !g.timePeriod.isHidden).map(g => g.timePeriod.id as number),
	)

	const visibleGroups = computed(() => groupedItems.value.filter(g => !g.timePeriod.isHidden))

	const singleVisibleGroupId = computed(() => visibleGroupIds.value[0] ?? null)

	async function onGroupSelectUpdate(newVal: number | number[]) {
		if (smAndDown.value) {
			const newId = newVal as number
			if (newId == null) return
			for (const group of groupedItems.value) {
				group.timePeriod.isHidden = group.timePeriod.id !== newId
			}
		} else {
			const newIds = newVal as number[]
			const currentIds = visibleGroupIds.value
			const toToggle = [
				...currentIds.filter(id => !newIds.includes(id)),
				...newIds.filter(id => !currentIds.includes(id)),
			]
			for (const id of toToggle) {
				const group = groupedItems.value.find(g => g.timePeriod.id === id)
				if (group) group.timePeriod.isHidden = !group.timePeriod.isHidden
			}
		}
	}

	onMounted(() => {
		getAllRecords()
	})

	function toggleChangeOrderMode() {
		isInChangeOrderMode.value = !isInChangeOrderMode.value
	}

	function openHistoryDialog(timePeriod: RoutineTimePeriodEntity) {
		historyDialog.value?.open(timePeriod)
	}

	function getAllRecords() {
		showFullScreenLoading()
		getAllGrouped().then(response => {
			groupedItems.value = response
		})
	}

	async function add(request: RoutineTodoListItemRequest) {
		const response = await createWithResponse(request)
		const updatedList = groupedItems.value.find(group => group.timePeriod.id === response.timePeriod.id)?.items
		if (updatedList) {
			updatedList.push(response)
			updatedList.sort((a, b) => a.id - b.id)
		}
		showSuccessSnackbar(t('successFeedback.added'))
	}

	async function edit(beforeEditEntity: RoutineTodoListItemEntity, toDoListItemRequest: RoutineTodoListItemRequest) {
		const savedRequest = RoutineTodoListItemRequest.fromEntity(beforeEditEntity)
		await update(beforeEditEntity.id, toDoListItemRequest)
		const updatedItem = await fetchById(beforeEditEntity.id)
		const updatedList = groupedItems.value.find(group => group.timePeriod.id === updatedItem.timePeriod.id)?.items
		if (updatedList) {
			if (updatedItem.timePeriod.id === beforeEditEntity.timePeriod.id) {
				updatedList[updatedList.findIndex(item => item.id === updatedItem.id)] = updatedItem
			} else {
				const oldGroup = groupedItems.value.find(
					group => group.timePeriod.id === beforeEditEntity.timePeriod.id,
				)
				if (oldGroup) {
					oldGroup.items = oldGroup.items.filter(item => item.id !== updatedItem.id)
				}
				updatedList.push(updatedItem)
			}
		}
		showSuccessSnackbar(t('successFeedback.updated'))
		pushEditUndo(beforeEditEntity.activity.name, async () => {
			await update(beforeEditEntity.id, savedRequest)
			const reverted = await fetchById(beforeEditEntity.id)
			const targetGroup = groupedItems.value.find(g => g.timePeriod.id === reverted.timePeriod.id)
			if (targetGroup) {
				const idx = targetGroup.items.findIndex(i => i.id === reverted.id)
				if (idx !== -1) targetGroup.items[idx] = reverted
				else targetGroup.items.push(reverted)
			}
			if (reverted.timePeriod.id !== updatedItem.timePeriod.id) {
				const movedGroup = groupedItems.value.find(g => g.timePeriod.id === updatedItem.timePeriod.id)
				if (movedGroup) movedGroup.items = movedGroup.items.filter(i => i.id !== reverted.id)
			}
		})
	}

	async function onDelete(id: number) {
		const group = groupedItems.value.find(g => g.items.some(item => item.id === id))
		if (!group) return
		const savedIndex = group.items.findIndex(item => item.id === id)
		const savedItem = group.items[savedIndex]
		if (!savedItem) return
		const precedingId = savedIndex > 0 ? (group.items[savedIndex - 1]?.id ?? null) : null
		const followingId = savedIndex < group.items.length - 1 ? (group.items[savedIndex + 1]?.id ?? null) : null
		await deleteEntity(id)
		group.items = group.items.filter(item => item.id !== id)
		pushDeleteUndo(savedItem.activity.name, async () => {
			const restored = await createWithResponse(RoutineTodoListItemRequest.fromEntity(savedItem))
			await changeDisplayOrder(new ChangeDisplayOrderRequest(restored.id, precedingId, followingId))
			const targetGroup = groupedItems.value.find(g => g.timePeriod.id === restored.timePeriod.id)
			if (targetGroup) {
				targetGroup.items.push(restored)
				targetGroup.items.sort((a, b) => a.id - b.id)
			}
		})
	}

	function openAddToPlanner(item: RoutineTodoListItemEntity) {
		plannerStore.openCreateDialogWithActivity(
			item.activity.id,
			undefined,
			'routine',
			item.suggestedTime ?? undefined,
		)
	}

	function openLogTime(item: RoutineTodoListItemEntity, isManual: boolean) {
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
		let activityName = ''
		if (itemId !== undefined) {
			for (const group of groupedItems.value) {
				const found = group.items.find(i => i.id === itemId)
				if (found) {
					activityName = found.activity.name
					break
				}
			}
		}
		pushLogTimeUndo(
			activityName,
			historyRecordId,
			itemWasCompleted && itemId !== undefined
				? async () => {
						await toggleIsDone(itemId, false)
						await onItemsChanged([itemId])
					}
				: undefined,
		)
	}

	async function createPlannerTask(request: PlannerTaskRequest) {
		await createPlannerTaskWithResponse(request)
		showSuccessSnackbar(t('successFeedback.added'))
	}

	async function handleIsDoneChange(id: number, forceValue: boolean) {
		await toggleIsDone(id, forceValue)
		await onItemsChanged([id])
	}

	async function handleOrderChange(
		oldIndex: number,
		newIndex: number,
		request: ChangeDisplayOrderRequest,
		timePeriodId: number,
	) {
		const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
		if (!group) return
		const movedItem = group.items[oldIndex]
		if (!movedItem) return
		const originalPrecedingId = oldIndex > 0 ? (group.items[oldIndex - 1]?.id ?? null) : null
		const originalFollowingId = oldIndex < group.items.length - 1 ? (group.items[oldIndex + 1]?.id ?? null) : null
		const [moved] = group.items.splice(oldIndex, 1)
		if (moved) group.items.splice(newIndex, 0, moved)
		await changeDisplayOrder(request)
		const reverseRequest = new ChangeDisplayOrderRequest(movedItem.id, originalPrecedingId, originalFollowingId)
		pushReorderUndo(movedItem.activity.name, async () => {
			await changeDisplayOrder(reverseRequest)
			const currentGroup = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
			if (currentGroup) {
				const currentIndex = currentGroup.items.findIndex(i => i.id === movedItem.id)
				if (currentIndex !== -1) {
					const [movedBack] = currentGroup.items.splice(currentIndex, 1)
					if (movedBack) currentGroup.items.splice(oldIndex, 0, movedBack)
				}
			}
		})
	}

	async function handleUncheckAll(doneIds: number[], groupId: number) {
		await uncheckAllApi(doneIds)
		await onItemsChanged(doneIds)
		pushUncheckAllUndo(doneIds.length, async () => {
			for (const id of doneIds) await toggleIsDone(id, true)
			await onItemsChanged(doneIds)
		})
	}

	async function handleCrossListDrop(sourceListId: number, targetListId: number, itemId: number, dropTarget: any) {
		const sourceGroup = groupedItems.value.find(g => g.timePeriod.id === sourceListId)
		const targetGroup = groupedItems.value.find(g => g.timePeriod.id === targetListId)

		if (!sourceGroup || !targetGroup) return

		const sourceIndex = sourceGroup.items.findIndex(item => item.id === itemId)
		const movedItem = sourceGroup.items[sourceIndex]

		if (!movedItem) return

		const originalPrecedingId = sourceIndex > 0 ? (sourceGroup.items[sourceIndex - 1]?.id ?? null) : null
		const originalFollowingId =
			sourceIndex < sourceGroup.items.length - 1 ? (sourceGroup.items[sourceIndex + 1]?.id ?? null) : null

		sourceGroup.items.splice(sourceIndex, 1)

		let targetIndex = 0
		if (dropTarget.data.type === 'drop-zone') {
			targetIndex = dropTarget.data.index
			if (dropTarget.data.position === 'bottom') {
				targetIndex += 1
			}
		}
		targetGroup.items.splice(targetIndex, 0, movedItem)

		const updateRequest = new RoutineTodoListItemRequest(
			movedItem.activity.id,
			targetListId,
			movedItem.doneCount,
			movedItem.totalCount,
			movedItem.isDone,
		)
		await update(itemId, updateRequest)

		const precedingItem = targetIndex > 0 ? targetGroup.items[targetIndex - 1] : null
		const followingItem = targetIndex < targetGroup.items.length - 1 ? targetGroup.items[targetIndex + 1] : null
		const orderRequest = new ChangeDisplayOrderRequest(itemId, precedingItem?.id ?? null, followingItem?.id ?? null)
		await changeDisplayOrder(orderRequest)

		const reverseUpdateRequest = new RoutineTodoListItemRequest(
			movedItem.activity.id,
			sourceListId,
			movedItem.doneCount,
			movedItem.totalCount,
			movedItem.isDone,
		)
		const reverseOrderRequest = new ChangeDisplayOrderRequest(itemId, originalPrecedingId, originalFollowingId)
		pushReorderUndo(movedItem.activity.name, async () => {
			await update(itemId, reverseUpdateRequest)
			await changeDisplayOrder(reverseOrderRequest)
			const currentTarget = groupedItems.value.find(g => g.timePeriod.id === targetListId)
			const currentSource = groupedItems.value.find(g => g.timePeriod.id === sourceListId)
			if (currentTarget && currentSource) {
				const idx = currentTarget.items.findIndex(i => i.id === itemId)
				if (idx !== -1) {
					const [item] = currentTarget.items.splice(idx, 1)
					if (item) currentSource.items.splice(sourceIndex, 0, item)
				}
			}
		})
	}

	async function onItemsChanged(changedItems: number[]) {
		for (const id of changedItems) {
			const updatedItem = await fetchById(id)
			const group = groupedItems.value.find(g => g.timePeriod.id === updatedItem.timePeriod.id)
			if (group) {
				const index = group.items.findIndex(item => item.id === id)
				if (index !== -1) {
					group.items[index] = updatedItem
					const groupId = group.timePeriod.id as number
					if (
						group.items.length > 0 &&
						group.items.every(item => item.isDone) &&
						!celebratedGroupIds.has(groupId)
					) {
						celebratedGroupIds.add(groupId)
						triggerConfetti()
					}
				}
			}
		}
	}
</script>
