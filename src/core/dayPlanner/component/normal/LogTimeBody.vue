<template>
	<template v-if="isManual">
		<div class="d-flex flex-wrap justify-center ga-4 py-2">
			<TimePicker
				v-model="startTime"
				icon="clock"
				:label="$t('planner.logTime.startTimeLabel')"
				hideDetails
			/>
			<TimePicker
				v-model="length"
				icon="hourglass-end"
				:label="$t('planner.logTime.lengthLabel')"
				hideDetails
			/>
		</div>
	</template>
	<template v-else>
		<div class="d-flex flex-column ga-3 py-2">
			<VBtn
				v-for="option in timerOptions"
				:key="option.type"
				:prependIcon="option.icon"
				variant="tonal"
				color="primaryOutline"
				size="large"
				@click="selectTimer(option.type)"
			>
				{{ option.label }}
			</VBtn>
			<VBtn
				prependIcon="fas fa-pen"
				variant="tonal"
				color="primaryOutline"
				size="large"
				@click="switchToManual"
			>
				{{ $t('planner.logTime.manualEntry') }}
			</VBtn>
		</div>
	</template>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import TimePicker from '@/_common/component/dateTime/TimePicker.vue'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	export type LogTimeResult =
		| { type: 'confirm'; startTime: Time; length: Time }
		| { type: 'selectTimer'; timerType: string }

	const {
		manualMode = false,
		initialStartTime,
		initialLength,
	} = defineProps<{
		manualMode?: boolean
		initialStartTime: Time
		initialLength: Time
	}>()

	const dialogApi = useDialogApi<LogTimeResult>()
	const { t } = useI18n()

	const isManual = ref(manualMode)
	const startTime = ref(new Time(initialStartTime.hours, initialStartTime.minutes))
	const length = ref(new Time(initialLength.hours, initialLength.minutes))

	const timerOptions = [
		{ label: t('planner.logTime.stopwatch'), icon: 'fas fa-stopwatch', type: 'stopwatch' },
		{ label: t('planner.logTime.timer'), icon: 'fas fa-hourglass-half', type: 'timer' },
		{ label: t('planner.logTime.pomodoro'), icon: 'fas fa-circle-dot', type: 'pomodoro' },
	]

	dialogApi.onConfirm(onConfirm)

	function switchToManual() {
		isManual.value = true
		dialogApi.setDialogProps({ hasConfirmBtn: true, title: t('planner.logTime.logTimeManuallyTitle') })
	}

	function selectTimer(type: string) {
		dialogApi.close({ type: 'selectTimer', timerType: type })
	}

	function onConfirm() {
		dialogApi.close({ type: 'confirm', startTime: startTime.value, length: length.value })
	}
</script>
