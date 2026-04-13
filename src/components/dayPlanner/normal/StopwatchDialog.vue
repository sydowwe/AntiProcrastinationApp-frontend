<template>
	<MyDialog
		v-model="model"
		title="Stopwatch"
		:persistent="isRunning"
		:showConfirmBtn="false"
		width="550"
	>
		<StopWatchView
			:activityId
			:activityName
			@started="handleStarted"
			@done="handleDone"
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import StopWatchView from '@/views/addActivityHistory/StopWatchView.vue'
	import { ref } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { PatchPlannerTaskStatusRequest } from '@/dtos/request/activityPlanning/PatchPlannerTaskStatusRequest.ts'
	import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'

	const model = defineModel<boolean>({ default: false })

	const { activityId, activityName, plannerTaskId } = defineProps<{
		activityId: number
		activityName: string
		plannerTaskId: number
	}>()

	const emit = defineEmits<{
		done: [startTimestamp: Date, length: Time]
	}>()

	const { patchStatus } = useTaskPlannerCrud()
	const isRunning = ref(false)

	function handleStarted(actualStartTime: Time) {
		isRunning.value = true
		patchStatus(plannerTaskId, new PatchPlannerTaskStatusRequest(PlannerTaskStatus.InProgress, actualStartTime))
	}

	function handleDone(startTimestamp: Date, length: Time) {
		isRunning.value = false
		model.value = false
		emit('done', startTimestamp, length)
	}
</script>
