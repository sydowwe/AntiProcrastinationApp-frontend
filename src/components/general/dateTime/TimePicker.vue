<!-- TimePicker.vue -->
<template>
<VMenu :closeOnContentClick="false">
	<template v-slot:activator="{ props: menuProps }">
		<VBtn
			v-bind="menuProps"
			variant="outlined"
			:prependIcon="icon"
			:height="height"
			:disabled
			:class="{'pr-2': !!icon}"
		>
			{{ label }} {{ timeString ? '-' : '' }} {{ timeString }}
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
import {computed} from 'vue'
import {Time} from '@/utils/Time.ts'

const props = withDefaults(defineProps<{
	label?: string
	icon?: string
	allowedMinutesSelected?: '5' | '10' | '15' | '20' | '30' | '45' | '60'
	height?: string | number
	disabled?: boolean
}>(), {
	label: 'Time',
	allowedMinutesSelected: '10',
	height: 40,
	disabled: false
})

const time = defineModel<Time>({required: true})

const allowedMinutes = computed(() => (m: number) => m % parseInt(props.allowedMinutesSelected) === 0)

const timeString = computed({
	get() {
		const fixedTime = Time.fromJson(time.value)
		return fixedTime.getString()
	},
	set(newTime: string) {
		time.value = Time.fromString(newTime)
	}
})
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
