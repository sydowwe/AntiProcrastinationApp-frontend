<template>
<div class="d-flex align-content-center pa-2" style="border: 1px solid white; border-radius: 5px;">
	<VTextField
		v-model="hours"
		:label="$t('dateTime.hours')"
		type="number"
		min="0"
		max="23"
		prepend-icon="chevron-left"
		@click:prepend="quickChangeTime('h',-1)"
		append-icon="chevron-right"
		@click:append="quickChangeTime('h',1)"
		@mousedown="handleMouseDownAppend($event)"
		@mouseup="handleMouseUp"
		:clearable="false"
		hide-spin-buttons
		hide-details
	></VTextField>
	<span class="mx-1" style="font-size: xx-large;line-height: 1.2;">:</span>
	<VTextField
		:label="$t('dateTime.minutes')"
		v-model="minutes"
		type="number"
		min="0"
		max="59"
		prepend-icon="chevron-left"
		@click:prepend="quickChangeTime('m',-1)"
		append-icon="chevron-right"
		@click:append="quickChangeTime('m',1)"
		hide-spin-buttons
		:clearable="false"
		hide-details
	></VTextField>
</div>
</template>
<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {TimeObject} from "@/classes/TimeUtils";
const props = defineProps({
	showArrows: {
		type: Boolean,
		default: true,
	},
});
const hours = ref(0);
const minutes = ref(0);

function quickChangeTime(timePart: string, changeValue: number) {
	if (timePart === 'h') {
		if (changeValue > 0) {
			if (hours.value === 23) {
				hours.value = 0;
			} else {
				hours.value++;
			}
		} else {
			if (hours.value === 0) {
				hours.value = 23;
			} else {
				hours.value--;
			}
		}
	} else {
		if (changeValue > 0) {
			if (minutes.value == 59) {
				minutes.value = 0;
			} else {
				minutes.value++;
			}
		} else {
			if (minutes.value === 0) {
				minutes.value = 59;
			} else {
				minutes.value--;
			}
		}
	}
}
let timer: number;
function handleMouseDownAppend(event: MouseEvent) {
	timer = setTimeout(() => {
		console.log("Button held down");
	}, 500); // Adjust the time as needed
}

function handleMouseUp() {
	clearTimeout(timer);
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
<style>
.v-input__append {
	margin-inline-start: 2px!important;
}
.v-input__prepend{
	margin-inline-end: 2px!important;
}
</style>