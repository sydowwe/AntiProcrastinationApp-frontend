<!-- TimeRangePicker.vue -->
<template>
<div class="d-flex ga-4 align-center flex-wrap">
	<!-- Start Time Picker -->
	<div class="d-flex ga-4 align-center">
		<VMenu :closeOnContentClick="false">
			<template v-slot:activator="{ props }">
				<VBtn
					v-bind="props"
					variant="outlined"
					prependIcon="clock"
					height="40"
				>
					{{ mode === 'length' ? 'Start' : 'From' }}: {{ formattedStartTime }}
				</VBtn>
			</template>
			<template v-slot:default>
				<VTimePicker
					v-model="startTime"
					format="24hr"
					:allowedMinutes
					scrollable
				/>
			</template>
		</VMenu>
		<!-- Mode Toggle Button -->
		<VIconBtn
			variant="tonal"
			color="secondaryOutline"
			:icon="mode === 'length' ? 'right-left' : 'clock'"
			size="small"
			@click="toggleMode"
			:title="mode === 'length' ? 'Switch to time r ange' : 'Switch to duration'"
		/>
	</div>

	<!-- Length Mode: Span Hours -->
	<VNumberInput
		v-if="mode === 'length'"
		v-model="span"
		label="Time span (hours)"
		controlVariant="split"
		density="compact"
		:min="1"
		:max="24"
		style="width: 150px"
		hideDetails
	/>

	<!-- Range Mode: End Time -->
	<VMenu v-else :closeOnContentClick="false">
		<template v-slot:activator="{ props }">
			<VBtn
				v-bind="props"
				variant="outlined"
				prependIcon="clock"
				height="40"
			>
				To: {{ formattedEndTime }}
			</VBtn>
		</template>
		<template v-slot:default>
			<VTimePicker
				v-model="endTime"
				format="24hr"
				:allowedMinutes
				scrollable
			/>
		</template>
	</VMenu>

</div>
</template>

<script setup lang="ts">
import {computed, ref, watch, type PropType} from 'vue'
import {Time} from '@/classes/TimeUtils.ts';

const props = defineProps({
	allowedMinutesSelected: {
		type: String as PropType<'5' | '10' | '15' | '20' | '30' | '45' | '60'>,
		default: '10',
	}
})

const allowedMinutes = computed(() => (m: number) => m % parseInt(props.allowedMinutesSelected) === 0)

const start = defineModel<Time>('start', {required: true})
const end = defineModel<Time>('end', {required: true})

type Mode = 'length' | 'range'
const mode = ref<Mode>(
	(localStorage.getItem('timeRangePickerMode') as Mode) || 'length'
)

const startTime = computed({
	get() {
		return start.value.toString;
	},
	set(time: string) {
		start.value = Time.fromString(time);
	}
});
const endTime = computed({
	get() {
		return end.value.toString;
	},
	set(time: string) {
		end.value = Time.fromString(time);
	}
});
const span = computed({
	get() {
		let diff = end.value?.getInMinutes - start.value?.getInMinutes

		if (diff < 0) {
			diff += 24 * 60;
		}
		const newSpan = diff / 60;
		emit('spanChanged', newSpan)
		return newSpan;
	},
	set(newSpan: number) {
		end.value = Time.fromMinutes((start.value.getInMinutes + newSpan * 60) % (24 * 60));
	}
});

const formattedStartTime = computed(() => {
	return startTime.value.toString().padStart(2, '0')
})

const formattedEndTime = computed(() => {
	return endTime.value.toString().padStart(2, '0')
})


const toggleMode = () => {
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