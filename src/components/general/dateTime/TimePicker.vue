<template>
<div class="d-flex justify-center align-center ga-1">
	<VNumberInput
		v-if="showHours"
		v-model="timeValue.hours"
		:label
		:disabled
		suffix="h"
		control-variant="split"
		:hide-details="!required"
		:rules="required && !showMinutes ? [positiveRule] : []"
		:required
	></VNumberInput>
	<span v-if="showHours && showMinutes" :class="required ? 'mb-7' : 'mb-2'"
	      style="font-size: xx-large;line-height: 0.8;">:</span>
	<VNumberInput
		v-if="showMinutes"
		v-model="timeValue.minutes"
		:label="!showHours ? label : ''"
		:disabled
		suffix="m"
		control-variant="split"
		:hide-details="!required"
		:rules="required ? [positiveRule] : []"
		:required
	></VNumberInput>
</div>
</template>

<script setup lang="ts">
import {watch} from "vue";
import {Time} from "@/utils/TimeUtils";

const positiveRule = (v: number) => (v > 0 || timeValue.value.hours > 0) || 'Musí byť viac ako 0'

const props = defineProps({
	showHours: {
		type: Boolean,
		default: true,
	},
	showMinutes: {
		type: Boolean,
		default: true,
	},
	disabled: Boolean,
	required: Boolean,
	label: String,
});

const timeValue = defineModel<Time>({default: new Time()});

watch(() => timeValue.value.hours, (newValue) => {
	// Handle wrap-around for hours
	if (newValue > 23) {
		timeValue.value.hours = 0;
	} else if (newValue < 0) {
		timeValue.value.hours = 23;
	} else {
		emit('hoursChanged', newValue);
	}
});

watch(() => timeValue.value.minutes, (newValue) => {
	// Handle wrap-around for minutes
	if (newValue > 59) {
		timeValue.value.minutes = 0;
	} else if (newValue < 0) {
		timeValue.value.minutes = 59;
	} else {
		emit('minutesChanged', newValue);
	}
})

const emit = defineEmits<{
	(e: 'hoursChanged', hours: number): void
	(e: 'minutesChanged', minutes: number): void
}>();
</script>