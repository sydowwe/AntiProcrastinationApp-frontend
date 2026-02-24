<!-- TimeRangePicker.vue -->
<template>
<div class="d-flex ga-2 align-center flex-wrap">
	<!-- Start Time Picker -->
	<div class="d-flex ga-2 align-center">
		<TimePicker
			v-model="start"
			:icon="startIcon"
			:label="mode === 'length' ? 'Start' : 'From'"
			:allowedMinutesSelected
			:density="density"
			hideDetails
		/>
		<!-- Mode Toggle Button -->
		<VIconBtn
			variant="tonal"
			color="secondaryOutline"
			:icon="mode === 'length' ? 'right-left' : 'clock'"
			size="small"
			@click="toggleMode"
			:title="mode === 'length' ? 'Switch to time range' : 'Switch to duration'"
		/>
	</div>

	<!-- Length Mode: Span Hours -->
	<VNumberInput
		v-if="mode === 'length'"
		v-model="span"
		label="Time span (hours)"
		controlVariant="split"
		:density="density"
		:min="1"
		:max="24"
		style="width: 150px"
		hideDetails
	/>

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
import {computed, type PropType, ref} from 'vue'
import {Time} from '@/dtos/dto/Time.ts'
import TimePicker from '@/components/general/dateTime/TimePicker.vue'

const props = defineProps({
	startIcon: {
		type: String,
	},
	endIcon: {
		type: String,
	},
	allowedMinutesSelected: {
		type: String as PropType<'5' | '10' | '15' | '20' | '30' | '45' | '60'>,
		default: '10',
	},
	density: {
		type: String as PropType<'default' | 'comfortable' | 'compact'>,
		default: 'comfortable',
	}
})

const start = defineModel<Time>('start', {required: true})
const end = defineModel<Time>('end', {required: true})

type Mode = 'length' | 'range'
const mode = ref<Mode>(
	(localStorage.getItem('timeRangePickerMode') as Mode) || 'length'
)

const span = computed({
	get() {
		let diff = Time.fromJson(end.value)?.getInMinutes - Time.fromJson(start.value)?.getInMinutes

		console.log(Time.fromJson(end.value)?.getInMinutes)
		if (diff < 0) {
			diff += 24 * 60
		}
		const newSpan = diff / 60
		emit('spanChanged', newSpan)
		return newSpan
	},
	set(newSpan: number) {
		end.value = Time.fromMinutes((Time.fromJson(start.value).getInMinutes + newSpan * 60) % (24 * 60))
	}
})

function toggleMode() {
	if (mode.value === 'length') {
		mode.value = 'range'
	} else {
		mode.value = 'length'
	}
	localStorage.setItem('timeRangePickerMode', mode.value)
}

const emit = defineEmits<{
	(e: 'spanChanged', spanHours: number): void
}>()
</script>

<style scoped>
/* Add any specific styles if needed */
</style>