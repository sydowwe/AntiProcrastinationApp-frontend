<!-- TimePicker.vue -->
<template>
<VBtn
	:variant
	:color
	:prependIcon="icon"
	:height
	:disabled
	:class="{'pr-2': !!icon}"
>
	<template v-if="!hideLabel && label">
		{{ label }} -
	</template>
	{{ timeString }}
	<VMenu :closeOnContentClick="false" activator="parent">
		<template v-slot:default>
			<VTimePicker
				v-model="timeString"
				format="24hr"
				:viewMode
				:allowedMinutes
				scrollable
			/>
		</template>
	</VMenu>
</VBtn>

</template>

<script setup lang="ts">
import {computed} from 'vue'
import {Time} from '@/utils/Time.ts'

const props = withDefaults(defineProps<{
	variant?: 'outlined' | 'tonal' | 'elevated'
	color?: string
	label?: string
	viewMode?: 'hour' | 'minute' | 'second'
	icon?: string
	allowedMinutesSelected?: '1' | '5' | '10' | '15' | '20' | '30' | '45' | '60'
	height?: 40 | 48 | 56,
	disabled?: boolean,
	hideLabel?: boolean,
}>(), {
	variant: 'outlined',
	label: 'Time',
	viewMode: 'hour',
	allowedMinutesSelected: '1',
	height: 48,
	disabled: false,
	hideLabel: false,
})

const time = defineModel<Time>({required: true})

const allowedMinutes = computed(() => (m: number) => m % parseInt(props.allowedMinutesSelected) === 0)

const timeString = computed({
	get() {
		const fixedTime = Time.fromJson(time.value)
		return fixedTime.getString()
	},
	set(newTime: string) {
		console.log(newTime)
		time.value = Time.fromString(newTime)
	}
})
console.log(time)
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
