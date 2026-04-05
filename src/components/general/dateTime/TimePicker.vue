<!-- TimePickerTextField.vue -->
<template>
	<div class="d-flex align-center">
		<VIconBtn
			v-if="showArrows"
			:class="{ 'mb-5': !hideDetails }"
			icon="fa-solid fa-chevron-left"
			variant="text"
			:density="density"
			@click="quickAddMinutes(true)"
		/>
		<VMaskInput
			v-model="inputValue"
			:label
			:color
			:disabled
			:prependInnerIcon="icon"
			:density
			:clearable="false"
			mask="##:##"
			returnMaskedValue
			:active="menuOpen"
			:hideDetails
			:rules
		>
			<VMenu
				v-model="menuOpen"
				:closeOnContentClick="false"
				activator="parent"
			>
				<template #default>
					<VTimePicker
						v-model="timeString"
						format="24hr"
						:viewMode
						:allowedMinutes
						scrollable
					/>
				</template>
			</VMenu>
		</VMaskInput>
		<VIconBtn
			v-if="showArrows"
			:class="{ 'mb-5': !hideDetails }"
			icon="fa-solid fa-chevron-right"
			variant="text"
			:density="density"
			@click="quickAddMinutes(false)"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { VMaskInput } from 'vuetify/labs/components'
	import { Time } from '@/dtos/dto/Time.ts'

	const {
		color = 'base',
		showArrows = false,
		hideDetails = false,
		rules = [],
		label = 'Time',
		viewMode = 'hour',
		icon = 'far fa-clock',
		allowedMinutesSelected = '5',
		density = 'comfortable',
		disabled = false,
	} = defineProps<{
		color?: string
		showArrows?: boolean
		hideDetails?: boolean
		rules?: readonly ((value: unknown) => string | boolean)[]
		label?: string
		viewMode?: 'hour' | 'minute' | 'second'
		icon?: string
		allowedMinutesSelected?: '1' | '5' | '10' | '15' | '20' | '30' | '45' | '60'
		density?: 'default' | 'comfortable' | 'compact'
		disabled?: boolean
	}>()

	const time = defineModel<Time>({ required: true })
	const menuOpen = ref(false)
	const inputValue = ref(Time.fromJson(time.value).getString())

	const allowedMinutes = computed(() => (m: number) => m % parseInt(allowedMinutesSelected) === 0)

	function roundToNearestAllowedMinute(minutes: number): number {
		const interval = parseInt(allowedMinutesSelected)
		return Math.round(minutes / interval) * interval
	}

	const timeString = computed({
		get() {
			const fixedTime = Time.fromJson(time.value)
			return fixedTime.getString()
		},
		set(newTime: string) {
			time.value = Time.fromString(newTime)
		},
	})

	function quickAddMinutes(subtract: boolean): void {
		const minutes = allowedMinutesSelected === '1' ? 5 : parseInt(allowedMinutesSelected)
		if (subtract) {
			const newMinutes = time.value.getInMinutes - minutes
			time.value = Time.fromMinutes(newMinutes < 0 ? 0 : newMinutes)
		} else {
			time.value = Time.fromMinutes(time.value.getInMinutes + minutes)
		}
	}

	// Watch inputValue and update timeString when complete
	watch(inputValue, newValue => {
		if (newValue && newValue.length === 5) {
			const [hours, minutes] = newValue.split(':').map(Number)
			if (hours === undefined || minutes === undefined) {
				return
			}
			// Validate 24-hour format (hours 0-23, minutes 0-59)
			if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
				const roundedMinutes = roundToNearestAllowedMinute(minutes)
				timeString.value = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`
			} else {
				// Reset to current valid time if invalid
				inputValue.value = Time.fromJson(time.value).getString()
			}
		}
	})

	// Watch for external changes to time (e.g., from VTimePicker)
	watch(
		() => time.value,
		newTime => {
			const newTimeString = Time.fromJson(newTime).getString()
			if (inputValue.value !== newTimeString) {
				inputValue.value = newTimeString
			}
		},
		{ deep: true },
	)
</script>
