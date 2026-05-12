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
	import LogTimeController from '@/components/dayPlanner/normal/LogTimeController.vue'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'
	import { PatchPlannerTaskStatusRequest } from '@/dtos/request/activityPlanning/PatchPlannerTaskStatusRequest.ts'
	import router from '@/plugins/router.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'

	const store = useDayPlannerStore()
	const { patchStatus, fetchById } = useTaskPlannerCrud()
	const { create: createActivityHistory } = useActivityHistoryCrud()
	const { showSuccessSnackbar } = useSnackbar()

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
				showSuccessSnackbar('Task marked done')
				router.replace({ query: {} })
			},
			{ immediate: true },
		)
	}

	function openPlannerTask(taskId: number, manual: boolean) {
		const task = store.tasks.find(t => t.id === taskId) as PlannerTask
		currentPlannerTaskId.value = taskId
		currentActivityId.value = task.activity.id
		const durationMins = (task.endTime.getInMinutes - task.startTime.getInMinutes + 1440) % 1440
		inner.value?.open(
			task.activity.id,
			task.activity.name,
			manual,
			new Time(task.startTime.hours, task.startTime.minutes),
			Time.fromMinutes(durationMins),
		)
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
			showSuccessSnackbar('Task marked completed')
		} else {
			const startTimestamp = new Date()
			startTimestamp.setHours(actualStartTime.hours, actualStartTime.minutes, 0, 0)
			await createActivityHistory(startTimestamp, length, currentActivityId.value!)
			showSuccessSnackbar('Time logged')
		}
		currentPlannerTaskId.value = null
		currentActivityId.value = null
	}

	async function handleTrackingDone({ startTimestamp, length }: { startTimestamp: Date; length: Time }) {
		const plannerTaskId = currentPlannerTaskId.value
		if (plannerTaskId !== null) {
			const actualStartTime = Time.fromDate(startTimestamp)
			const actualEndTime = Time.fromMinutes((actualStartTime.getInMinutes + length.getInMinutes) % 1440)
			await Promise.all([
				patchStatus(
					plannerTaskId,
					new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, actualStartTime, actualEndTime),
				),
				createActivityHistory(startTimestamp, length, currentActivityId.value!),
			])
			const updated = await fetchById(plannerTaskId)
			const idx = store.tasks.findIndex(t => t.id === plannerTaskId)
			if (idx >= 0) {
				store.tasks[idx] = updated
			}
			store.clearSelection()
			showSuccessSnackbar('Task marked done')
		} else {
			await createActivityHistory(startTimestamp, length, currentActivityId.value!)
			showSuccessSnackbar('Time logged')
		}
		currentPlannerTaskId.value = null
		currentActivityId.value = null
	}

	defineExpose({ openManual, openFromSelection })
</script>
