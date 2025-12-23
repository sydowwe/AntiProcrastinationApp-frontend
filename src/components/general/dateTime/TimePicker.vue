<!-- TimePicker.vue -->
<template>
<VMenu :closeOnContentClick="false">
	<template v-slot:activator="{ props: menuProps }">
		<VBtn
			v-bind="menuProps"
			variant="outlined"
			prependIcon="clock"
			:height="height"
			:disabled
		>
			{{ label }}: {{ formattedTime }}
		</VBtn>
	</template>
	<template v-slot:default>
		<VTimePicker
			v-model="timeString"
			format="24hr"
			:allowedMinutes
			scrollable
		/>
	</template>
</VMenu>
</template>

<script setup lang="ts">
import {computed, type PropType} from 'vue'
import {Time} from '@/utils/Time.ts'

const props = defineProps({
	label: {
		type: String,
		default: 'Time'
	},
	allowedMinutesSelected: {
		type: String as PropType<'5' | '10' | '15' | '20' | '30' | '45' | '60'>,
		default: '10'
	},
	height: {
		type: [String, Number],
		default: 40
	},
	disabled: {
		type: Boolean,
		default: false
	}
})

const time = defineModel<Time>({required: true})

const allowedMinutes = computed(() => (m: number) => m % parseInt(props.allowedMinutesSelected) === 0)

const timeString = computed({
	get() {
		return time.value.toString
	},
	set(newTime: string) {
		time.value = Time.fromString(newTime)
	}
})

const formattedTime = computed(() => {
	return timeString.value.toString().padStart(2, '0')
})
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
