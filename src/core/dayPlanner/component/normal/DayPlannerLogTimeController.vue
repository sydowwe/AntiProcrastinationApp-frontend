<template>
	<LogTimeController
		ref="inner"
		:plannerTaskId="currentPlannerTaskId ?? undefined"
		@confirm="handleConfirm"
		@trackingDone="handleTrackingDone"
	/>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import LogTimeController from '@/core/dayPlanner/component/normal/LogTimeController.vue'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useActivityHistoryCrud, type TrackedTime } from '@/core/activityHistory/api/activityHistoryApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { minutesOfDayInUserZone, timeInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
	import router from '@/router.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { useI18n } from 'vue-i18n'

	const store = useDayPlannerStore()
	const { patchStatus, fetchById } = useTaskPlannerCrud()
	const { create: createActivityHistory, createTracked } = useActivityHistoryCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { t } = useI18n()

	const inner = ref<InstanceType<typeof LogTimeController>>()
	const currentPlannerTaskId = ref<number | null>(null)
	const currentActivityId = ref<number | null>(null)

	// Handle return from timer views once tasks are loaded
	const returnQuery = router.currentRoute.value.query
	if (returnQuery.plannerTaskId && returnQuery.actualStartTime && returnQuery.actualLength) {
		const stopWatch = watch(
			() => store.tasks.length,
			async length => {
				if (length === 0) return
				stopWatch()
				const taskId = parseInt(returnQuery.plannerTaskId as string)
				const actualStartTime = Time.fromString(returnQuery.actualStartTime as string)
				const actualLength = Time.fromString(returnQuery.actualLength as string)
				const actualEndTime = Time.fromMinutes(
					(actualStartTime.getInMinutes + actualLength.getInMinutes) % 1440,
				)
				await patchStatus(
					taskId,
					new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, actualStartTime, actualEndTime),
				)
				const idx = store.tasks.findIndex(t => t.id === taskId)
				if (idx >= 0) {
					store.tasks[idx]!.isDone = true
					;(store.tasks[idx] as PlannerTask).actualStartTime = actualStartTime
					;(store.tasks[idx] as PlannerTask).actualEndTime = actualEndTime
				}
				showSuccessSnackbar(t('planner.feedback.taskMarkedDone'))
				router.replace({ query: {} })
			},
			{ immediate: true },
		)
	}

	function openPlannerTask(taskId: number, manual: boolean) {
		const task = store.tasks.find(t => t.id === taskId) as PlannerTask
		currentPlannerTaskId.value = taskId
		currentActivityId.value = task.activity.id
		const { startTime, length } = manual ? manualPrefill(task) : plannedSpan(task)
		inner.value?.open(task.activity.id, task.activity.name, manual, startTime, length)
	}

	function plannedSpan(task: PlannerTask): { startTime: Time; length: Time } {
		const durationMins = (task.endTime.getInMinutes - task.startTime.getInMinutes + 1440) % 1440
		return {
			startTime: new Time(task.startTime.hours, task.startTime.minutes),
			length: Time.fromMinutes(durationMins),
		}
	}

	/**
	 * What the manual dialog proposes as "when this was done". The plan, for a block nobody started. For a started
	 * one, what actually happened: its recorded start, running until now. Proposing the planned slot there was
	 * wrong in both fields for exactly the block most likely to be completed late — one that ran over. Only the
	 * manual path: elsewhere `length` seeds the timer, where the planned duration is the right answer.
	 *
	 * A started block may have no recorded start — the status menu sent none until `DayPlannerView.statusRequest`,
	 * and older rows keep that gap — so the planned start stands in for it. The end is still now: that much is known.
	 */
	function manualPrefill(task: PlannerTask): { startTime: Time; length: Time } {
		if (task.status !== PlannerTaskStatus.InProgress) return plannedSpan(task)
		const start = task.actualStartTime ?? task.startTime
		const elapsed = (minutesOfDayInUserZone() - start.getInMinutes + 1440) % 1440
		return {
			startTime: new Time(start.hours, start.minutes),
			// At least a minute: completing in the minute it was started would otherwise propose an empty length.
			length: Time.fromMinutes(Math.max(1, elapsed)),
		}
	}

	function openFromSelection() {
		openPlannerTask(store.selectedTaskIds.values().next().value!, false)
	}

	function openManual(taskId: number) {
		openPlannerTask(taskId, true)
	}

	async function handleConfirm(actualStartTime: Time, length: Time) {
		const plannerTaskId = currentPlannerTaskId.value
		if (plannerTaskId !== null) {
			const actualEndTime = Time.fromMinutes((actualStartTime.getInMinutes + length.getInMinutes) % 1440)
			await patchStatus(
				plannerTaskId,
				new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, actualStartTime, actualEndTime),
			)
			const idx = store.tasks.findIndex(t => t.id === plannerTaskId)
			if (idx >= 0) {
				store.tasks[idx].actualStartTime = actualStartTime
				store.tasks[idx].actualEndTime = actualEndTime
				store.tasks[idx].status = PlannerTaskStatus.Completed
			}
			store.clearSelection()
			showSuccessSnackbar(t('planner.feedback.taskMarkedCompleted'))
		} else {
			const startTimestamp = new Date()
			startTimestamp.setHours(actualStartTime.hours, actualStartTime.minutes, 0, 0)
			await createActivityHistory(startTimestamp, length, currentActivityId.value!)
			showSuccessSnackbar(t('planner.feedback.timeLogged'))
		}
		currentPlannerTaskId.value = null
		currentActivityId.value = null
	}

	async function handleTrackingDone(tracked: TrackedTime) {
		const { startTimestamp, length } = tracked
		const plannerTaskId = currentPlannerTaskId.value
		if (plannerTaskId !== null) {
			// `startTimestamp` is an instant. Read in the user's zone, because this is persisted as
			// the hour the work actually happened at.
			const actualStartTime = timeInUserZone(startTimestamp)
			const actualEndTime = Time.fromMinutes((actualStartTime.getInMinutes + length.getInMinutes) % 1440)
			// A task planned from a to-do item is that item's time, so the recap credits the item with it.
			const todoListItemId = store.tasks.find(t => t.id === plannerTaskId)?.todoListItemId ?? null
			// In this order, not in parallel. Saving the session now ticks off the plan on the server (FO2): with
			// this block already completed, its time is claimed and nothing else moves. Run concurrently, the
			// session could land first and be credited to whichever same-activity block the server picked.
			await patchStatus(
				plannerTaskId,
				new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, actualStartTime, actualEndTime),
			)
			await createTracked(tracked, currentActivityId.value!, { todoListItemId })
			const updated = await fetchById(plannerTaskId)
			const idx = store.tasks.findIndex(t => t.id === plannerTaskId)
			if (idx >= 0) {
				store.tasks[idx] = updated
			}
			store.clearSelection()
			showSuccessSnackbar(t('planner.feedback.taskMarkedDone'))
		} else {
			await createTracked(tracked, currentActivityId.value!)
			showSuccessSnackbar(t('planner.feedback.timeLogged'))
		}
		currentPlannerTaskId.value = null
		currentActivityId.value = null
	}

	defineExpose({ openManual, openFromSelection })
</script>
