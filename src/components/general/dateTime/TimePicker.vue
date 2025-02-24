<template>
<div class="d-flex justify-center align-center">
	<div v-if="whatToShow.includes('hours')" class="d-flex align-center">
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
			v-model="timeValue.hours"
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
	</div>
	<span v-if="whatToShow.includes('hours') && whatToShow.includes('minutes')" class="mb-2"
	      style="font-size: xx-large;line-height: 0.8;">:</span>
	<div v-if="whatToShow.includes('minutes')" class="d-flex align-center">
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
			v-model="timeValue.minutes"
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
	<span v-if="whatToShow.includes('seconds')" class="mb-2" style="font-size: xx-large;line-height: 0.8;">:</span>
	<div v-if="whatToShow.includes('seconds')" class="d-flex align-center">
		<VBtn
			variant="text"
			icon
			@click="quickChangeSeconds(-1)"
			style="border-radius: 3px"
			density="comfortable"
			@mousedown="continuousQuickChangeSeconds(-1)"
			@mouseup="endContinuousQuickChange"
			v-if="showArrows"
		>
			<VIcon icon="chevron-left" size="large" class="clickableIcon"></VIcon>
		</VBtn>
		<VTextField
			v-model="timeValue.seconds"
			type="number"
			min="0"
			max="59"
			@input="constrainSeconds"
			:clearable="false"
			suffix="S"
			hide-spin-buttons
			hide-details
		></VTextField>
		<VBtn
			variant="text"
			icon
			@click="quickChangeSeconds(1)"
			style="border-radius: 3px"
			density="comfortable"
			@mousedown="continuousQuickChangeSeconds(1)"
			@mouseup="endContinuousQuickChange"
			v-if="showArrows"
		>
			<VIcon icon="chevron-right" size="large" class="clickableIcon"></VIcon>
		</VBtn>
	</div>
</div>
</template>
<script setup lang="ts">
import {defineModel, reactive, watch} from "vue";
import {TimeLengthKeys, TimeLengthObject} from "@/classes/TimeUtils";
import {useI18n} from 'vue-i18n';


const props = defineProps({
	showArrows: {
		type: Boolean,
		default: true,
	},
	whatToShow: {
		type: Array as () => TimeLengthKeys[],
		default: () => ['hours', 'minutes'],
	}
});
const timeValue = defineModel<TimeLengthObject>({default: () => reactive(new TimeLengthObject())});
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

function continuousQuickChangeSeconds(value: number) {
	mouseDownTimeout = setTimeout(() => {
		quickChangeSeconds(value);
		continuousQuickChangeSeconds(value);
	}, 150);
}

function quickChangeHours(value: number) {
	switch (checkValidHours(timeValue.value.hours + value)) {
		case -1:
			timeValue.value.hours = 23;
			break;
		case 1:
			timeValue.value.hours = 0;
			break;
		case 0:
			timeValue.value.hours += value;
			break;
	}
}

function quickChangeMinutes(value: number) {
	switch (checkValidMinutesOrSeconds(timeValue.value.minutes + value)) {
		case -1:
			timeValue.value.minutes = 59;
			break;
		case 1:
			timeValue.value.minutes = 0;
			break;
		case 0:
			timeValue.value.minutes += value;
			break;
	}
}

function quickChangeSeconds(value: number) {
	switch (checkValidMinutesOrSeconds(timeValue.value.minutes + value)) {
		case -1:
			timeValue.value.seconds = 59;
			break;
		case 1:
			timeValue.value.seconds = 0;
			break;
		case 0:
			timeValue.value.seconds += value;
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
	console.log(timeValue.value.hours);
	switch (checkValidHours(timeValue.value.hours)) {
		case -1:
			timeValue.value.hours = 0;
			break;
		case 1:
			timeValue.value.hours = 23;
			break;
		case 0:
			timeValue.value.hours = parseInt(timeValue.value.hours);
			break;
	}
}

function constrainMinutes() {
	switch (checkValidMinutesOrSeconds(timeValue.value.minutes)) {
		case -1:
			timeValue.value.minutes = 0;
			break;
		case 1:
			timeValue.value.minutes = 59;
			break;
		case 0:
			timeValue.value.minutes = parseInt(timeValue.value.minutes);
	}
}

function constrainSeconds() {
	switch (checkValidMinutesOrSeconds(timeValue.value.seconds)) {
		case -1:
			timeValue.value.seconds = 0;
			break;
		case 1:
			timeValue.value.seconds = 59;
			break;
		case 0:
			timeValue.value.seconds = parseInt(timeValue.value.seconds);
	}
}

watch(() => timeValue.value.hours, (newValue) => {
	emit('hoursChanged', newValue);
});
watch(() => timeValue.value.minutes, (newValue) => {
	emit('minutesChanged', newValue);
})
watch(() => timeValue.value.seconds, (newValue) => {
	emit('secondsChanged', newValue);
})
const emit = defineEmits<{
	(e: 'hoursChanged', hours: number): void
	(e: 'minutesChanged', minutes: number): void
	(e: 'secondsChanged', minutes: number): void
}>();
</script>