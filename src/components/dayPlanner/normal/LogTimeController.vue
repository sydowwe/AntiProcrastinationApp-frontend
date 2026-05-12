<template>
	<LogTimeDialog
		v-if="activityId !== null"
		v-model="logTimeDialog"
		:manualMode
		:initialStartTime
		:initialLength
		@confirm="handleConfirm"
		@selectTimer="handleSelectTimer"
	/>
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
	import LogTimeDialog from '@/components/dayPlanner/normal/LogTimeDialog.vue'
	import TrackTimeDialog from '@/components/dayPlanner/normal/TrackTimeDialog.vue'
	import { Time } from '@/dtos/dto/Time.ts'

	const { plannerTaskId } = defineProps<{ plannerTaskId?: number }>()

	const emit = defineEmits<{
		confirm: [startTime: Time, length: Time]
		trackingDone: [data: { startTimestamp: Date; length: Time }]
	}>()

	const activityId = ref<number | null>(null)
	const activityName = ref('')
	const manualMode = ref(false)
	const initialStartTime = ref(new Time())
	const initialLength = ref(new Time())
	const logTimeDialog = ref(false)
	const trackTimeDialog = ref(false)
	const trackTimeMethod = ref<'stopwatch' | 'timer' | 'pomodoro'>('stopwatch')

	function open(activityIdVal: number, activityNameVal: string, isManual = false, startTime?: Time, length?: Time) {
		activityId.value = activityIdVal
		activityName.value = activityNameVal
		manualMode.value = isManual
		initialStartTime.value = startTime ?? new Time()
		initialLength.value = length ?? new Time()
		logTimeDialog.value = true
	}

	function handleConfirm(startTime: Time, length: Time) {
		logTimeDialog.value = false
		activityId.value = null
		emit('confirm', startTime, length)
	}

	function handleDone(data: { startTimestamp: Date; length: Time }) {
		trackTimeDialog.value = false
		activityId.value = null
		emit('trackingDone', data)
	}

	function handleSelectTimer(type: string) {
		trackTimeMethod.value = type as 'stopwatch' | 'timer' | 'pomodoro'
		trackTimeDialog.value = true
	}

	defineExpose({ open })
</script>
