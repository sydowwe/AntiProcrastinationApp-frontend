<template>
<div class="d-flex justify-center align-center ga-1">
	<VNumberInput
		v-if="showHours"
		v-model="timeValue.hours"
		:label
		:min="0"
		:max="23"
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
		:min="0"
		:max="59"
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
import {TimeObject} from "@/classes/TimeUtils";

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

const timeValue = defineModel<TimeObject>({default: new TimeObject()});

watch(() => timeValue.value.hours, (newValue) => {
	emit('hoursChanged', newValue);
});
watch(() => timeValue.value.minutes, (newValue) => {
	emit('minutesChanged', newValue);
})

const emit = defineEmits<{
	(e: 'hoursChanged', hours: number): void
	(e: 'minutesChanged', minutes: number): void
}>();
</script>