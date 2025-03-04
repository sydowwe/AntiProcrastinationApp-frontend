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
			@keydown="preventE"
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
			@keydown="preventE"
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
			v-if="showArrows"
		>
			<VIcon icon="chevron-right" size="large" class="clickableIcon"></VIcon>
		</VBtn>
	</div>
</div>
</template>
<script setup lang="ts">
import {defineModel, reactive, watch} from "vue";
import {TimeKeys, TimeObject} from "@/classes/TimeUtils";
import {useContinuousQuickChangeComposition, preventE} from '@/compositions/general/continuousQuickChangeComposition'

const continuousQuickChangeHours = useContinuousQuickChangeComposition(quickChangeHours);
const continuousQuickChangeMinutes = useContinuousQuickChangeComposition(quickChangeMinutes);

const props = defineProps({
	showArrows: {
		type: Boolean,
		default: true,
	},
	whatToShow: {
		type: Array as () => TimeKeys[],
		default: () => ['hours', 'minutes'],
	}
});
const timeValue = defineModel<TimeObject>({default: () => reactive(new TimeObject())});


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
	switch (checkValidMinutes(timeValue.value.minutes + value)) {
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


function checkValidHours(value: number) {
	if (value < 0) {
		return -1;
	} else if (value > 23) {
		return 1;
	} else {
		return 0;
	}
}

function checkValidMinutes(value: number) {
	if (value < 0) {
		return -1;
	} else if (value > 59) {
		return 1;
	} else {
		return 0;
	}
}

function constrainHours() {
	switch (checkValidHours(timeValue.value.hours)) {
		case -1:
			timeValue.value.hours = 0;
			break;
		case 1:
			timeValue.value.hours = 23;
			break;
	}
}

function constrainMinutes() {
	switch (checkValidMinutes(timeValue.value.minutes)) {
		case -1:
			timeValue.value.minutes = 0;
			break;
		case 1:
			timeValue.value.minutes = 59;
			break;
	}
}



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