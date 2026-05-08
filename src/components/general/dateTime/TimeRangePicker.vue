<!-- TimeRangePicker.vue -->
<template>
	<div class="d-flex ga-2 align-center flex-wrap">
		<!-- Start Time Picker -->
		<div class="d-flex ga-2 align-center mx-auto mx-md-0">
			<TimePicker
				v-model="start"
				:icon="startIcon"
				:label="label ?? (mode === 'length' ? 'Start' : 'From')"
				:allowedMinutesSelected
				:density="density"
				hideDetails
			/>
			<!-- Mode Toggle Button -->
			<VIconBtn
				class="mx-2"
				variant="tonal"
				color="secondaryOutline"
				:icon="mode === 'length' ? 'right-left' : 'clock'"
				size="small"
				:title="mode === 'length' ? 'Switch to time range' : 'Switch to duration'"
				@click="toggleMode"
			/>
		</div>

		<!-- Length Mode: Duration -->
		<div
			v-if="mode === 'length'"
			class="d-flex ga-2 align-center"
		>
			<VNumberInput
				v-model="spanHours"
				label="h"
				controlVariant="split"
				:density="density"
				:min="0"
				:max="23"
				style="width: 150px"
				hideDetails
			/>
			<VNumberInput
				v-model="spanMinutes"
				label="min"
				controlVariant="split"
				:density="density"
				:min="0"
				:max="55"
				:step="Number(allowedMinutesSelected)"
				style="width: 150px"
				hideDetails
			/>
		</div>

		<!-- Range Mode: End Time -->
		<TimePicker
			v-else
			v-model="end"
			:icon="endIcon"
			label="To"
			:allowedMinutesSelected
			:density="density"
			hideDetails
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'

	const { allowedMinutesSelected = '10', density = 'comfortable' } = defineProps<{
		label?: string
		startIcon?: string
		endIcon?: string
		allowedMinutesSelected?: '5' | '10' | '15' | '20' | '30' | '45' | '60'
		density?: 'default' | 'comfortable' | 'compact'
	}>()

	const emit = defineEmits<{
		(e: 'spanChanged', spanHours: number): void
	}>()
	const start = defineModel<Time>('start', { required: true })
	const end = defineModel<Time>('end', { required: true })

	type Mode = 'length' | 'range'
	const mode = ref<Mode>((localStorage.getItem('timeRangePickerMode') as Mode) || 'length')

	const span = computed({
		get() {
			let diff = Time.fromJson(end.value)?.getInMinutes - Time.fromJson(start.value)?.getInMinutes
			if (diff < 0) {
				diff += 24 * 60
			}
			emit('spanChanged', diff / 60)
			return diff
		},
		set(newSpan: number) {
			end.value = Time.fromMinutes((Time.fromJson(start.value).getInMinutes + newSpan) % (24 * 60))
		},
	})

	const spanHours = computed({
		get: () => Math.floor(span.value / 60),
		set(h: number) {
			span.value = h * 60 + (span.value % 60)
		},
	})

	const spanMinutes = computed({
		get: () => span.value % 60,
		set(m: number) {
			span.value = Math.floor(span.value / 60) * 60 + m
		},
	})

	function toggleMode() {
		if (mode.value === 'length') {
			mode.value = 'range'
		} else {
			mode.value = 'length'
		}
		localStorage.setItem('timeRangePickerMode', mode.value)
	}
</script>

<style scoped>
	/* Add any specific styles if needed */
</style>
