<template>
<div class="d-flex align-center">
	<VBtn
		variant="text"
		icon
		@click="quickChangeHours(-1)"
		style="border-radius: 3px"
		density="comfortable"
		@mousedown="continuousQuickChangeHours(-1)"
		@mouseup="endContinuousQuickChange"
		v-if="showArrows"
	>
		<VIcon icon="chevron-left" size="large" class="clickableIcon"></VIcon>
	</VBtn>
	<VTextField
		v-model="hours"
		type="number"
		min="0"
		max="23"
		@input="constrainHours"
		:clearable="false"
		suffix="H"
		hide-spin-buttons
		hide-details
	></VTextField>
	<VBtn
		variant="text"
		icon
		@click="quickChangeHours(1)"
		style="border-radius: 3px"
		density="comfortable"
		@mousedown="continuousQuickChangeHours(1)"
		@mouseup="endContinuousQuickChange"
		v-if="showArrows"
	>
		<VIcon icon="chevron-right" size="large" class="clickableIcon"></VIcon>
	</VBtn>
	<span class="mb-2" style="font-size: xx-large;line-height: 0.8;">:</span>
	<VBtn
		variant="text"
		icon
		@click="quickChangeMinutes(-1)"
		style="border-radius: 3px"
		density="comfortable"
		@mousedown="continuousQuickChangeMinutes(-1)"
		@mouseup="endContinuousQuickChange"
		v-if="showArrows"
	>
		<VIcon icon="chevron-left" size="large" class="clickableIcon"></VIcon>
	</VBtn>
	<VTextField
		v-model="minutes"
		type="number"
		min="0"
		max="59"
		@input="constrainMinutes"
		:clearable="false"
		suffix="M"
		hide-spin-buttons
		hide-details
	></VTextField>
	<VBtn
		variant="text"
		icon
		@click="quickChangeMinutes(1)"
		style="border-radius: 3px"
		density="comfortable"
		@mousedown="continuousQuickChangeMinutes(1)"
		@mouseup="endContinuousQuickChange"
		v-if="showArrows"
	>
		<VIcon icon="chevron-right" size="large" class="clickableIcon"></VIcon>
	</VBtn>
</div>
</template>
<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {TimeObject} from "@/classes/TimeUtils";
import {useI18n} from 'vue-i18n';

const i18n = useI18n();


const props = defineProps({
	showArrows: {
		type: Boolean,
		default: true,
	},
});
const hours = ref(0);
const minutes = ref(0);


let mouseDownTimeout = 0;

function endContinuousQuickChange() {
	clearTimeout(mouseDownTimeout);
}

function continuousQuickChangeHours(value: number) {
	mouseDownTimeout = setTimeout(() => {
		quickChangeHours(value);
		continuousQuickChangeHours(value);
	}, 150);
}

function continuousQuickChangeMinutes(value: number) {
	mouseDownTimeout = setTimeout(() => {
		quickChangeMinutes(value);
		continuousQuickChangeMinutes(value);
	}, 150);
}

function quickChangeHours(value: number) {
	switch (checkValidHours(hours.value + value)) {
		case -1:
			hours.value = 23;
			break;
		case 1:
			hours.value = 0;
			break;
		case 0:
			hours.value += value;
			break;
	}
}

function quickChangeMinutes(value: number) {
	switch (checkValidMinutesOrSeconds(minutes.value + value)) {
		case -1:
			minutes.value = 59;
			break;
		case 1:
			minutes.value = 0;
			break;
		case 0:
			minutes.value += value;
			break;
	}
}

function checkValidHours(value: number) {
	if (value < 0) {
		return -1;
	} else if (value > 23) {
		return 1;
	} else {
		return 0;
	}
}

function checkValidMinutesOrSeconds(value: number) {
	if (value < 0) {
		return -1;
	} else if (value > 59) {
		return 1;
	} else {
		return 0;
	}
}
function constrainHours() {
	switch (checkValidHours(hours.value)) {
		case -1:
			hours.value = 0;
			break;
		case 1:
			hours.value = 23;
			break;
		case 0:
			hours.value = parseInt(hours.value);
	}
}
function constrainMinutes() {
	switch (checkValidMinutesOrSeconds(minutes.value)) {
		case -1:
			minutes.value = 0;
			break;
		case 1:
			minutes.value = 59;
			break;
		case 0:
			minutes.value = parseInt(minutes.value);
	}
}


function set(newHours: number, newMinutes: number) {
	hours.value = newHours;
	minutes.value = newMinutes;
}

function reset() {
	hours.value = 0;
	minutes.value = 0;
}

watch(hours, (newValue) => {
	emit('hoursChanged', newValue);
});
watch(minutes, (newValue) => {
	emit('minutesChanged', newValue);
})
const getTimeObject = computed(() => new TimeObject(hours.value, minutes.value));
const emit = defineEmits<{
	(e: 'hoursChanged', hours: number): void
	(e: 'minutesChanged', minutes: number): void
}>();
defineExpose({getTimeObject, set, reset});
</script>