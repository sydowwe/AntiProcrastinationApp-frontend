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
					@delete="deleteItem"
					@edit="openEditDialog"
					@isDoneChanged="handleIsDoneChange"
					@stepToggled="onItemsChanged"
					@uncheckAll="handleUncheckAll"
					@itemsReordered="handleOrderChange"
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
	import RoutineConfetti from '@/core/todoList/component/routine/RoutineConfetti.vue'
	import RoutineGroupCard from '@/core/todoList/component/routine/RoutineGroupCard.vue'
	import RoutineWeeklyReviewCard from '@/core/todoList/component/routine/RoutineWeeklyReviewCard.vue'
	import PlannerTaskDialog from '@/core/dayPlanner/component/normal/PlannerTaskDialog.vue'
	import BaseTodoListLogTimeController from '@/core/todoList/component/BaseTodoListLogTimeController.vue'
	import TodoListUndoBtn from '@/core/todoList/component/TodoListUndoBtn.vue'
	import { computed, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { ToDoListKind } from '@/core/todoList/dto/enum/ToDoListKind'
	import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useQueryFocusTarget } from '@/_common/composable/general/useQueryFocusTarget.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useTodoListUndo } from '@/core/todoList/composable/useTodoListUndo.ts'
	import { useRoutineWeeklyReview } from '@/core/todoList/composable/useRoutineWeeklyReview.ts'
	import { useEstimateCalibration } from '@/core/todoList/composable/useEstimateCalibration.ts'
	import { useRoutineGroups } from '@/core/todoList/composable/useRoutineGroups.ts'
	import { useRoutineCelebration } from '@/core/todoList/composable/useRoutineCelebration.ts'
	import { useRoutineItemActions } from '@/core/todoList/composable/useRoutineItemActions.ts'
	import { useRoutineDialogs } from '@/core/todoList/composable/useRoutineDialogs.ts'
	import type { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'

	const { t } = useI18n()

	const { getAllGrouped } = useRoutineTodoListItemCrud()
	const { createWithResponse: createPlannerTaskWithResponse } = useTaskPlannerCrud()
	const { showSuccessSnackbar, showSnackbar } = useSnackbar()

	const focusTarget = useQueryFocusTarget({
		selector: id => `[data-routine-period-id="${CSS.escape(id)}"]`,
	})
	const { showFullScreenLoading } = useLoading()
	const { isNewWeek, ensureLoaded: ensureReviewDismissalLoaded, dismissForThisWeek } = useRoutineWeeklyReview()
	const { ensureLoaded: ensureCalibrationLoaded, calibrationRatio } = useEstimateCalibration()
	const plannerStore = useDayPlannerStore()

	const { undo, canUndo, stackSize, nextUndoDescription, pushLogTimeUndo } = useTodoListUndo()

	const {
		smAndDown,
		groupedItems,
		hideDoneGroupIds,
		updateHideDone,
		groupSelectItems,
		visibleGroupIds,
		visibleGroups,
		singleVisibleGroupId,
		reviewEligibleGroups,
		showWeeklyReview,
		handleReviewPause,
		handleReviewReduceFrequency,
		onGroupSelectUpdate,
	} = useRoutineGroups(isNewWeek)

	const { showConfetti, confettiKey, celebrateIfRare } = useRoutineCelebration()

	const {
		add,
		edit,
		deleteItem,
		handleOrderChange,
		handleUncheckAll,
		handleIsDoneChange,
		handleCrossListDrop,
		onItemsChanged,
	} = useRoutineItemActions(groupedItems, celebrateIfRare)

	const { openCreateDialog, openEditDialog, openHistoryDialog } = useRoutineDialogs(add, edit)

	const logTimeController = ref<InstanceType<typeof BaseTodoListLogTimeController>>()
	const isInChangeOrderMode = ref(false)

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
			itemWasCompleted && itemId !== undefined ? () => handleIsDoneChange(itemId, false) : undefined,
		)
	}

	async function createPlannerTask(request: PlannerTaskRequest) {
		await createPlannerTaskWithResponse(request)
		showSuccessSnackbar(t('successFeedback.added'))
	}
</script>
