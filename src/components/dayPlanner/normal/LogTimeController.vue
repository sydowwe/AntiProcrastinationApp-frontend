<template>
	<LogTimeDialog
		v-if="logTimeActivityId !== null"
		v-model="logTimeDialog"
		:manualMode="logTimeManualMode"
		:initialStartTime="logTimeInitialStart"
		:initialLength="logTimeInitialLength"
		@confirm="handleLogTimeManualConfirm"
		@selectTimer="handleSelectTimer"
	/>
	<TrackTimeDialog
		v-if="logTimeActivityId !== null"
		v-model="trackTimeDialog"
		:activityId="logTimeActivityId!"
		:activityName="logTimeActivityName"
		:plannerTaskId="currentPlannerTaskId ?? undefined"
		:initialMethod="trackTimeInitialMethod"
		:initialLength="logTimeInitialLength"
		@done="handleLogTimeDone"
	/>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import LogTimeDialog from '@/components/dayPlanner/normal/LogTimeDialog.vue'
	import TrackTimeDialog from '@/components/dayPlanner/normal/TrackTimeDialog.vue'
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

	const logTimeDialog = ref(false)
	const logTimeManualMode = ref(false)
	const currentPlannerTaskId = ref<number | null>(null)
	const logTimeActivityId = ref<number | null>(null)
	const logTimeActivityName = ref('')
	const logTimeInitialStart = ref(new Time())
	const logTimeInitialLength = ref(new Time())
	const trackTimeDialog = ref(false)
	const trackTimeInitialMethod = ref<'stopwatch' | 'timer' | 'pomodoro'>('stopwatch')

	// Handle return from timer views once tasks are loaded (planner context only)
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

	function open(activityId: number, activityName: string, initialStartTime?: Time, initialLength?: Time) {
		currentPlannerTaskId.value = null
		logTimeActivityId.value = activityId
		logTimeActivityName.value = activityName
		logTimeInitialStart.value = initialStartTime ?? new Time()
		logTimeInitialLength.value = initialLength ?? new Time()
		logTimeManualMode.value = false
		logTimeDialog.value = true
	}

	function openPlannerTask(taskId: number, manual: boolean) {
		const task = store.tasks.find(t => t.id === taskId) as PlannerTask
		currentPlannerTaskId.value = taskId
		logTimeActivityId.value = task.activity.id
		logTimeActivityName.value = task.activity.name
		const durationMins = (task.endTime.getInMinutes - task.startTime.getInMinutes + 1440) % 1440
		logTimeInitialStart.value = new Time(task.startTime.hours, task.startTime.minutes)
		logTimeInitialLength.value = Time.fromMinutes(durationMins)
		logTimeManualMode.value = manual
		logTimeDialog.value = true
	}

	function openFromSelection() {
		openPlannerTask(store.selectedTaskIds.values().next().value!, false)
	}

	function openManual(taskId: number) {
		openPlannerTask(taskId, true)
	}

	async function handleLogTimeManualConfirm(actualStartTime: Time, length: Time) {
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
			await createActivityHistory(startTimestamp, length, logTimeActivityId.value!)
			showSuccessSnackbar('Time logged')
		}
		logTimeActivityId.value = null
		currentPlannerTaskId.value = null
	}

	async function handleLogTimeDone({ startTimestamp, length }: { startTimestamp: Date; length: Time }) {
		const plannerTaskId = currentPlannerTaskId.value
		if (plannerTaskId !== null) {
			const actualStartTime = Time.fromDate(startTimestamp)
			const actualEndTime = Time.fromMinutes((actualStartTime.getInMinutes + length.getInMinutes) % 1440)
			await Promise.all([
				patchStatus(
					plannerTaskId,
					new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Completed, actualStartTime, actualEndTime),
				),
				createActivityHistory(startTimestamp, length, logTimeActivityId.value!),
			])
			const updated = await fetchById(plannerTaskId)
			const idx = store.tasks.findIndex(t => t.id === plannerTaskId)
			if (idx >= 0) {
				store.tasks[idx] = updated
			}
			store.clearSelection()
			showSuccessSnackbar('Task marked done')
		} else {
			await createActivityHistory(startTimestamp, length, logTimeActivityId.value!)
			showSuccessSnackbar('Time logged')
		}
		logTimeActivityId.value = null
		currentPlannerTaskId.value = null
	}

	function handleSelectTimer(type: string) {
		trackTimeInitialMethod.value = type as 'stopwatch' | 'timer' | 'pomodoro'
		trackTimeDialog.value = true
	}

	defineExpose({ open, openManual, openFromSelection })
</script>
