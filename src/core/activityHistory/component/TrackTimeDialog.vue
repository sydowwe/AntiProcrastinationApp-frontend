<!--
	`persistent` used to be bound to `isRunning`, blocking the backdrop click to protect state that
	closing the dialog destroyed anyway. The running session is durable now, so closing costs nothing
	and fighting the user for it is only friction. What is still worth guarding is the *result* panel:
	an unconfirmed length is the one thing here that is not written down anywhere yet.
-->
<template>
	<MyDialog
		v-model="model"
		:title="$t('history.logTaskTitle', { activity: activityName })"
		:persistent="showResult"
		:hasConfirmBtn="showResult"
		:isSmall="showResult"
		@confirmed="handleConfirm"
	>
		<div v-if="lengthData !== null && !isRunning">
			<h3>{{ $t('history.taskDoneFor', { duration: Time.getString(lengthData.length) }) }}</h3>
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
					{{ $t('navigation.stopwatch') }}
				</VBtn>
				<VBtn
					value="timer"
					prependIcon="fas fa-hourglass-half"
				>
					{{ $t('navigation.timer') }}
				</VBtn>
				<VBtn
					value="pomodoro"
					prependIcon="fas fa-circle-dot"
				>
					{{ $t('navigation.pomodoroTimer') }}
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
				:activityName
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
	import PomodoroTimerView from '@/core/activityHistory/component/PomodoroTimerView.vue'
	import { computed, ref, watch } from 'vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useRunningTimerStore } from '@/core/activityHistory/store/runningTimerStore.ts'

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

	const store = useRunningTimerStore()

	/**
	 * The session this dialog's task has running, if any. It is read from the store rather than
	 * latched on the `started` emit: a local flag was reset by every reopen and by every toggle of
	 * the method buttons, which is how switching method mid-session used to unmount a running child
	 * and throw its elapsed time away without asking.
	 */
	const trackedSession = computed(() => {
		const current = store.session
		return current !== null && current.pinnedActivityId === activityId ? current : null
	})
	const isRunning = computed(() => trackedSession.value !== null)

	const selectedMethod = ref<Method>(trackedSession.value?.kind ?? initialMethod)
	const lengthData = ref<{ startTimestamp: Date; length: Time } | null>(null)
	/** The dialog's second face: a finished length waiting to be confirmed back to the caller. */
	const showResult = computed(() => lengthData.value !== null && !isRunning.value)

	watch(model, open => {
		if (!open) return
		// Reopening onto a live session shows the timer that is actually running, whatever method the
		// caller asked for — the toggle is hidden while `isRunning`, so anything else would strand it.
		selectedMethod.value = trackedSession.value?.kind ?? initialMethod
		lengthData.value = null
	})

	// Same reason, for a session that is still running when the dialog is first mounted.
	watch(trackedSession, current => {
		if (current !== null) selectedMethod.value = current.kind
	})

	function handleStarted(actualStartTime: Time) {
		emit('started', actualStartTime)
	}

	function handleDone(startTimestamp: Date, length: Time) {
		lengthData.value = { startTimestamp, length }
	}

	function handleConfirm() {
		emit('done', lengthData.value!)
	}
</script>
