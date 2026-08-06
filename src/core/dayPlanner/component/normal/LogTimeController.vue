<template>
	<TrackTimeDialog
		v-if="activityId !== null"
		v-model="trackTimeDialog"
		:activityId="activityId!"
		:activityName
		:plannerTaskId
		:initialMethod="trackTimeMethod"
		:initialLength
		@done="handleDone"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import LogTimeBody from '@/core/dayPlanner/component/normal/LogTimeBody.vue'
	import type { LogTimeResult } from '@/core/dayPlanner/component/normal/LogTimeBody.vue'
	import TrackTimeDialog from '@/core/dayPlanner/component/normal/TrackTimeDialog.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'

	const { plannerTaskId } = defineProps<{ plannerTaskId?: number }>()

	const emit = defineEmits<{
		confirm: [startTime: Time, length: Time]
		trackingDone: [data: { startTimestamp: Date; length: Time }]
	}>()

	const { openDialog } = useDialog()

	const activityId = ref<number | null>(null)
	const activityName = ref('')
	const trackTimeDialog = ref(false)
	const trackTimeMethod = ref<'stopwatch' | 'timer' | 'pomodoro'>('stopwatch')

	async function open(
		activityIdVal: number,
		activityNameVal: string,
		isManual = false,
		startTime?: Time,
		length?: Time,
	) {
		activityId.value = activityIdVal
		activityName.value = activityNameVal
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

	function handleDone(data: { startTimestamp: Date; length: Time }) {
		trackTimeDialog.value = false
		activityId.value = null
		emit('trackingDone', data)
	}

	defineExpose({ open })
</script>
