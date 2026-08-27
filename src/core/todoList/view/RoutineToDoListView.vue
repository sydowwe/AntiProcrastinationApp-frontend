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
					@click="openCreateDialog"
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
		<div
			v-if="calibration"
			class="mx-auto w-100 w-lg-66 px-3 pb-2 text-caption text-medium-emphasis text-center"
		>
			{{ $t('toDoList.calibration.header', { ratio: calibration.ratio.toFixed(1) }) }}
		</div>
		<RoutineWeeklyReviewCard
			v-if="showWeeklyReview"
			class="mx-auto w-100 w-lg-66 px-3 pb-3"
			:groups="reviewEligibleGroups"
			@pause="handleReviewPause"
			@reduceFrequency="handleReviewReduceFrequency"
			@dismissed="dismissForThisWeek"
		/>
		<VRow
			class="flex-grow-1 overflow-hidden ma-0"
			style="min-height: 0"
			justify="center"
			align="start"
		>
			<VCol
				v-for="group in visibleGroups"
				:key="group.timePeriod.id"
				:data-routine-period-id="group.timePeriod.id"
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
					@quickStartTimer="(item: RoutineTodoListItemEntity) => openLogTime(item, false, true)"
					@addToPlanner="openAddToPlanner"
					@delete="onDelete"
					@edit="openEditDialog"
					@isDoneChanged="handleIsDoneChange"
					@stepToggled="onItemsChanged"
					@uncheckAll="(doneIds: number[]) => handleUncheckAll(doneIds)"
					@itemsReordered="
						(oldIndex: number, newIndex: number, request: ChangeDisplayOrderRequest) =>
							handleOrderChange(oldIndex, newIndex, request, group.timePeriod.id as number)
					"
					@crossListDrop="handleCrossListDrop"
					@openHistory="openHistoryDialog"
					@freezeSpent="getAllRecords"
				/>
			</VCol>
		</VRow>
	</div>
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
	import RoutineToDoListForm from '@/core/todoList/component/routine/dialog/RoutineToDoListForm.vue'
	import RoutineConfetti from '@/core/todoList/component/routine/RoutineConfetti.vue'
	import RoutineGroupHistoryBody from '@/core/todoList/component/routine/dialog/RoutineGroupHistoryBody.vue'
	import RoutineGroupCard from '@/core/todoList/component/routine/RoutineGroupCard.vue'
	import RoutineWeeklyReviewCard from '@/core/todoList/component/routine/RoutineWeeklyReviewCard.vue'
	import PlannerTaskDialog from '@/core/dayPlanner/component/normal/PlannerTaskDialog.vue'
	import BaseTodoListLogTimeController from '@/core/todoList/component/BaseTodoListLogTimeController.vue'
	import TodoListUndoBtn from '@/core/todoList/component/TodoListUndoBtn.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import { RoutineTodoListItemRequest } from '@/core/todoList/dto/request/RoutineTodoListItemRequest.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { ChangeDisplayOrderRequest } from '@/core/todoList/dto/request/ChangeDisplayOrderRequest.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind'
	import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
	import { useRoutineTimePeriodCrud } from '@/core/todoList/api/timePeriodApi.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useQueryFocusTarget } from '@/_common/composable/general/useQueryFocusTarget.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'
	import { useRoutineRunLabel } from '@/core/todoList/composable/useRoutineRunLabel.ts'
	import { useRoutineWeeklyReview } from '@/core/todoList/composable/useRoutineWeeklyReview.ts'
	import { useEstimateCalibration } from '@/core/todoList/composable/useEstimateCalibration.ts'
	import type { TimePeriodRequest } from '@/core/todoList/dto/request/TimePeriodRequest.ts'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'
	import type { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import type { RoutineTodoListGroupedList } from '@/core/todoList/dto/response/routine/RoutineTodoListGroupedList.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
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
	const { update: updateTimePeriod, changeTimePeriodVisibility } = useRoutineTimePeriodCrud()
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const { showSuccessSnackbar, showSnackbar } = useSnackbar()

	const focusTarget = useQueryFocusTarget({
		selector: id => `[data-routine-period-id="${CSS.escape(id)}"]`,
	})
	const { showFullScreenLoading } = useLoading()
	const { openDialog } = useDialog()
	const { runLabel } = useRoutineRunLabel()
	const { isNewWeek, ensureLoaded: ensureReviewDismissalLoaded, dismissForThisWeek } = useRoutineWeeklyReview()
	const { ensureLoaded: ensureCalibrationLoaded, calibrationRatio } = useEstimateCalibration()
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
	const logTimeController = ref<InstanceType<typeof BaseTodoListLogTimeController>>()
	const isInChangeOrderMode = ref(false)

	const showConfetti = ref(false)
	const confettiKey = ref(0)

	// Celebration is reserved for genuinely rare events. Firing on every completed group habituates
	// into meaninglessness within weeks — a daily group would celebrate every single day.
	const RUN_MILESTONES = [7, 30, 90, 180, 365]

	function triggerConfetti() {
		confettiKey.value++
		showConfetti.value = true
		setTimeout(() => {
			showConfetti.value = false
		}, 2500)
	}

	function celebrateIfRare(before: RoutineTimePeriodEntity, after: RoutineTimePeriodEntity) {
		if (after.streak <= before.streak) return
		const groupName = after.text ?? ''
		// A new longest run — only once the user has an established record to pass.
		if (before.bestStreak > 0 && after.streak > before.bestStreak) {
			triggerConfetti()
			showSuccessSnackbar(
				t('routineTodoList.newLongestRun', {
					group: groupName,
					run: runLabel(after.streak, after.lengthInDays),
				}),
			)
			return
		}
		const milestone = RUN_MILESTONES.find(m => before.streak < m && after.streak >= m)
		if (milestone !== undefined) {
			triggerConfetti()
			showSuccessSnackbar(
				t('routineTodoList.milestoneReached', {
					group: groupName,
					run: runLabel(milestone, after.lengthInDays),
				}),
			)
		}
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

	const reviewEligibleGroups = computed(() =>
		groupedItems.value.filter(g => !g.timePeriod.isHidden && g.timePeriod.totalPeriodsElapsed > 0),
	)
	const showWeeklyReview = computed(() => isNewWeek.value && reviewEligibleGroups.value.length > 0)

	async function handleReviewPause(timePeriodId: number) {
		await changeTimePeriodVisibility(timePeriodId)
		const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
		if (group) group.timePeriod.isHidden = true
	}

	async function handleReviewReduceFrequency(timePeriodId: number, request: TimePeriodRequest) {
		await updateTimePeriod(timePeriodId, request)
		const group = groupedItems.value.find(g => g.timePeriod.id === timePeriodId)
		if (group) Object.assign(group.timePeriod, request)
	}

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
		// Not awaited alongside the review load — the two are independent and used to run concurrently.
		void getAllRecords().then(revealFocusedPeriod)
		ensureReviewDismissalLoaded()
	})

	/**
	 * `?focus=<timePeriodId>` — arriving from a routine notification, which is about one specific
	 * period ("Weekly ends in 2 days, 3 tasks left").
	 *
	 * A hidden group is the interesting case. Hiding is a persisted choice (`changeTimePeriodVisibility`
	 * writes it server-side), so revealing the group by un-hiding it would let a notification click
	 * silently undo a setting the user made — and leave it undone. Saying where to find it is the
	 * honest alternative; without this the user lands on a list that simply does not contain the thing
	 * they were just told about.
	 */
	async function revealFocusedPeriod() {
		const id = focusTarget.targetId()
		if (id === null) return

		const group = groupedItems.value.find(g => g.timePeriod.id === Number(id))
		if (group !== undefined && group.timePeriod.isHidden) {
			focusTarget.clear()
			showSnackbar(t('routineTodoList.focusHiddenGroup', { group: group.timePeriod.text ?? '' }), {
				color: 'warning',
			})
			return
		}

		// Falls through for an unknown id too: the period may have been deleted since the notification
		// was raised, and `reveal` treats "no such row" as a no-op after clearing the parameter.
		await focusTarget.reveal()
	}

	function toggleChangeOrderMode() {
		isInChangeOrderMode.value = !isInChangeOrderMode.value
	}

	function openHistoryDialog(timePeriod: RoutineTimePeriodEntity) {
		const name = timePeriod.text ?? 'History'
		openDialog({
			component: RoutineGroupHistoryBody,
			componentProps: { timePeriod },
			dialogProps: {
				title: `${name} · ${timePeriod.lengthInDays}-day periods`,
				hasConfirmBtn: false,
				closeBtnText: 'Close',
				isSmall: false,
			},
		})
	}

	async function openCreateDialog() {
		const result = await openDialog<{
			entity: RoutineTodoListItemEntity | null
			request: RoutineTodoListItemRequest
		}>({
			component: RoutineToDoListForm,
			dialogProps: {
				title: t('general.add') + ' to routine to-do list',
				confirmBtnLabel: t('general.add'),
			},
		})
		if (result) {
			await add(result.request)
		}
	}

	async function openEditDialog(entityToEdit: RoutineTodoListItemEntity) {
		const result = await openDialog<{
			entity: RoutineTodoListItemEntity | null
			request: RoutineTodoListItemRequest
		}>({
			component: RoutineToDoListForm,
			componentProps: { entityToEdit },
			dialogProps: {
				title: t('general.edit'),
				confirmBtnLabel: t('general.edit'),
			},
		})
		if (result?.entity) {
			await edit(result.entity, result.request)
		}
	}

	// Returns the promise so a caller can sequence on the loaded groups — the deep-link reveal in
	// `onMounted` cannot look for a card before the cards exist. Every other call site ignores it and
	// is unaffected.
	function getAllRecords() {
		showFullScreenLoading()
		return getAllGrouped().then(response => {
			groupedItems.value = response
			void ensureCalibrationLoaded(response.flatMap(group => group.items.map(item => item.activity.id)))
		})
	}

	const calibration = computed(() =>
		calibrationRatio(
			groupedItems.value
				.flatMap(group => group.items)
				.filter(item => item.suggestedTime?.isNotZero())
				.map(item => ({ activityId: item.activity.id, suggestedSeconds: item.suggestedTime!.getInSeconds })),
		),
	)

	async function add(request: RoutineTodoListItemRequest) {
		const response = await createWithResponse(request)
		const updatedList = groupedItems.value.find(group => group.timePeriod.id === response.timePeriod.id)?.items
		if (updatedList) {
			updatedList.push(response)
			updatedList.sort((a, b) => a.id - b.id)
		}
		showSuccessSnackbar(t('successFeedback.added'))
		void ensureCalibrationLoaded([response.activity.id])
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

	function openLogTime(item: RoutineTodoListItemEntity, isManual: boolean, autoStart = false) {
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

	async function handleIsDoneChange(id: number, forceValue?: boolean) {
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

	async function handleUncheckAll(doneIds: number[]) {
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
					// Keep the group's stats (streak, consistency, history) in step with the refetched item,
					// then judge whether the change was rare enough to celebrate.
					const previousTimePeriod = group.timePeriod
					// isHidden is local view state (the group selector mutates it without persisting),
					// so it must survive the refresh.
					updatedItem.timePeriod.isHidden = previousTimePeriod.isHidden
					group.timePeriod = updatedItem.timePeriod
					celebrateIfRare(previousTimePeriod, updatedItem.timePeriod)
				}
			}
		}
	}
</script>
