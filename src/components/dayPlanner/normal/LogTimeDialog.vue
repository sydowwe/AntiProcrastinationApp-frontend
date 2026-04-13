<template>
	<MyDialog
		v-model="model"
		:title="isManual ? 'Log time manually' : 'Log time'"
		:showConfirmBtn="isManual"
		confirmBtnText="Mark done"
		@confirmed="handleConfirm"
	>
		<template v-if="isManual">
			<div class="d-flex flex-wrap justify-center ga-4 py-2">
				<TimePicker
					v-model="startTime"
					icon="clock"
					label="Actual start time"
					hideDetails
				/>
				<TimePicker
					v-model="length"
					icon="hourglass-end"
					label="Length"
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
					@click="handleSelectTimer(option.type)"
				>
					{{ option.label }}
				</VBtn>
				<VBtn
					prependIcon="fas fa-pen"
					variant="tonal"
					color="primaryOutline"
					size="large"
					@click="isManual = true"
				>
					Manual entry
				</VBtn>
			</div>
		</template>
	</MyDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import { ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'

	const model = defineModel<boolean>({ default: false })

	const { manualMode = false, initialStartTime, initialLength } = defineProps<{
		manualMode?: boolean
		initialStartTime: Time
		initialLength: Time
	}>()

	const emit = defineEmits<{
		confirm: [startTime: Time, length: Time]
		selectTimer: [type: string]
	}>()

	const timerOptions = [
		{ label: 'Stopwatch', icon: 'fas fa-stopwatch', type: 'stopwatch' },
		{ label: 'Timer', icon: 'fas fa-hourglass-half', type: 'timer' },
		{ label: 'Pomodoro', icon: 'fas fa-circle-dot', type: 'pomodoro' },
	]

	const isManual = ref(manualMode)
	const startTime = ref(new Time())
	const length = ref(new Time())

	watch(
		model,
		open => {
			if (open) {
				isManual.value = manualMode
				startTime.value = new Time(initialStartTime.hours, initialStartTime.minutes)
				length.value = new Time(initialLength.hours, initialLength.minutes)
			}
		},
		{ immediate: true },
	)

	function handleSelectTimer(type: string) {
		model.value = false
		emit('selectTimer', type)
	}

	function handleConfirm() {
		emit('confirm', startTime.value, length.value)
	}
</script>
