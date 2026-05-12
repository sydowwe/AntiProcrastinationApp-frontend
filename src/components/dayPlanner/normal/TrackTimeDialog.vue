<template>
	<MyDialog
		v-model="model"
		:title="'Log task: ' + activityName"
		:persistent="isRunning"
		:hasConfirmBtn="!isRunning && lengthData"
		:isSmall="lengthData && !isRunning"
		@confirmed="handleConfirm"
	>
		<div v-if="lengthData && !isRunning">
			<h3>Task done for {{ Time.getString(lengthData.length) }}</h3>
		</div>
		<div
			v-else
			class="d-flex flex-column"
		>
			<VBtnToggle
				v-if="!isRunning"
				v-model="selectedMethod"
				mandatory
				density="comfortable"
				color="primary"
				class="mb-4 align-self-center"
			>
				<VBtn
					value="stopwatch"
					prependIcon="fas fa-stopwatch"
				>
					Stopwatch
				</VBtn>
				<VBtn
					value="timer"
					prependIcon="fas fa-hourglass-half"
				>
					Timer
				</VBtn>
				<VBtn
					value="pomodoro"
					prependIcon="fas fa-circle-dot"
				>
					Pomodoro
				</VBtn>
			</VBtnToggle>
			<StopWatchView
				v-if="selectedMethod === 'stopwatch'"
				:activityId
				compact
				@started="handleStarted"
				@done="handleDone"
			/>
			<TimerView
				v-else-if="selectedMethod === 'timer'"
				:activityId
				:activityName
				:initialDuration="initialLength"
				compact
				@started="handleStarted"
				@done="handleDone"
			/>
			<PomodoroTimerView
				v-else-if="selectedMethod === 'pomodoro'"
				:activityId
				compact
				@started="handleStarted"
				@done="handleDone"
			/>
		</div>
	</MyDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import StopWatchView from '@/views/addActivityHistory/StopWatchView.vue'
	import TimerView from '@/views/addActivityHistory/TimerView.vue'
	import PomodoroTimerView from '@/views/addActivityHistory/PomodoroTimerView.vue'
	import { ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { PatchPlannerTaskStatusRequest } from '@/dtos/request/activityPlanning/PatchPlannerTaskStatusRequest.ts'
	import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'

	type Method = 'stopwatch' | 'timer' | 'pomodoro'

	const {
		activityId,
		activityName,
		plannerTaskId,
		initialMethod = 'stopwatch',
		initialLength,
	} = defineProps<{
		activityId: number
		activityName: string
		plannerTaskId?: number
		initialMethod?: Method
		initialLength?: Time
	}>()

	const emit = defineEmits<{
		done: [{ startTimestamp: Date; length: Time }]
	}>()

	const model = defineModel<boolean>({ default: false })

	const { patchStatus } = useTaskPlannerCrud()

	const selectedMethod = ref<Method>(initialMethod)
	const isRunning = ref(false)
	const lengthData = ref<{ startTimestamp: Date; length: Time } | null>(null)

	watch(model, open => {
		if (open) {
			selectedMethod.value = initialMethod
			isRunning.value = false
		}
	})

	watch(selectedMethod, () => {
		isRunning.value = false
	})

	function handleStarted(actualStartTime: Time) {
		isRunning.value = true
		if (plannerTaskId) {
			patchStatus(plannerTaskId, new PatchPlannerTaskStatusRequest(PlannerTaskStatus.InProgress, actualStartTime))
		}
	}

	function handleDone(startTimestamp: Date, length: Time) {
		isRunning.value = false
		lengthData.value = { startTimestamp, length }
	}

	function handleConfirm() {
		emit('done', lengthData.value!)
	}
</script>
