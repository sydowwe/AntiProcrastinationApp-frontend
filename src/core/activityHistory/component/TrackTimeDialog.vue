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
				v-if="!isRunning && !autoStart"
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
				:autoStart
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
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import StopWatchView from '@/core/activityHistory/view/StopWatchView.vue'
	import TimerView from '@/core/activityHistory/view/TimerView.vue'
	import PomodoroTimerView from '@/core/activityHistory/view/PomodoroTimerView.vue'
	import { ref, watch } from 'vue'
	import { Time } from '@/_common/dto/dto/Time.ts'

	type Method = 'stopwatch' | 'timer' | 'pomodoro'

	const {
		activityId,
		activityName,
		initialMethod = 'stopwatch',
		initialLength,
		autoStart = false,
	} = defineProps<{
		activityId: number
		activityName: string
		initialMethod?: Method
		initialLength?: Time
		autoStart?: boolean
	}>()

	const emit = defineEmits<{
		started: [actualStartTime: Time]
		done: [{ startTimestamp: Date; length: Time }]
	}>()

	const model = defineModel<boolean>({ default: false })

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
		emit('started', actualStartTime)
	}

	function handleDone(startTimestamp: Date, length: Time) {
		isRunning.value = false
		lengthData.value = { startTimestamp, length }
	}

	function handleConfirm() {
		emit('done', lengthData.value!)
	}
</script>
