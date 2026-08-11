<template>
	<TrackTimeDialog
		v-if="activityId !== null"
		v-model="trackTimeDialog"
		:activityId="activityId!"
		:activityName
		:initialMethod="trackTimeMethod"
		:initialLength="dialogInitialLength"
		:autoStart
		@started="handleStarted"
		@done="handleDone"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import LogTimeBody from '@/core/dayPlanner/component/normal/LogTimeBody.vue'
	import type { LogTimeResult } from '@/core/dayPlanner/component/normal/LogTimeBody.vue'
	import TrackTimeDialog from '@/core/activityHistory/component/TrackTimeDialog.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'

	const { plannerTaskId } = defineProps<{ plannerTaskId?: number }>()

	const emit = defineEmits<{
		confirm: [startTime: Time, length: Time]
		trackingDone: [data: { startTimestamp: Date; length: Time }]
	}>()

	const { openDialog } = useDialog()
	const { markInProgress } = useTaskPlannerCrud()

	const activityId = ref<number | null>(null)
	const activityName = ref('')
	const trackTimeDialog = ref(false)
	const trackTimeMethod = ref<'stopwatch' | 'timer' | 'pomodoro'>('stopwatch')
	const dialogInitialLength = ref<Time | undefined>(undefined)
	const autoStart = ref(false)

	async function open(
		activityIdVal: number,
		activityNameVal: string,
		isManual = false,
		startTime?: Time,
		length?: Time,
		autoStartTimer = false,
	) {
		activityId.value = activityIdVal
		activityName.value = activityNameVal
		dialogInitialLength.value = length

		if (autoStartTimer) {
			autoStart.value = true
			trackTimeMethod.value = 'timer'
			trackTimeDialog.value = true
			return
		}

		autoStart.value = false
		const result = await openDialog<LogTimeResult>({
			component: LogTimeBody,
			componentProps: {
				manualMode: isManual,
				initialStartTime: startTime ?? new Time(),
				initialLength: length ?? new Time(),
			},
			dialogProps: {
				title: isManual ? 'Log time manually' : 'Log time',
				hasConfirmBtn: isManual,
			},
		})
		if (!result) return
		if (result.type === 'confirm') {
			emit('confirm', result.startTime, result.length)
		} else if (result.type === 'selectTimer') {
			trackTimeMethod.value = result.timerType as 'stopwatch' | 'timer' | 'pomodoro'
			trackTimeDialog.value = true
		}
	}

	function handleStarted(actualStartTime: Time) {
		if (plannerTaskId) {
			void markInProgress(plannerTaskId, actualStartTime)
		}
	}

	function handleDone(data: { startTimestamp: Date; length: Time }) {
		trackTimeDialog.value = false
		activityId.value = null
		emit('trackingDone', data)
	}

	defineExpose({ open })
</script>
