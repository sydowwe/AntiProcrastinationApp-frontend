<script setup lang="ts">
import {computed} from 'vue';

const props = defineProps({
	label: String,
	min: Number,
	max: Number,
	step: {type: Number, default: 1},
	suffix: String,
	clearable: Boolean,
	resettable: Boolean,
	useArrows: {type: Boolean, default: false},
	hideControls: {type: Boolean, default: false},
	defaultValue: Number,
	center: Boolean,
});
const value = defineModel<number | null>({required: true});
const currentValue = computed(()=>value.value ?? 0)
let mouseDownTimeout = 0;

function endContinuousQuickChange() {
	clearTimeout(mouseDownTimeout);
}

function continuousQuickChangeValue(value: number) {
	mouseDownTimeout = setTimeout(() => {
		quickChangeValue(value);
		continuousQuickChangeValue(value);
	}, 150);
}

function quickChangeValue(added: number) {
	switch (checkValidValue(currentValue.value + added)) {
		case -1:
			value.value = props.max ?? 0;
			break;
		case 1:
			value.value = props.min ?? 0;
			break;
		case 0:
			value.value = parseFloat((currentValue.value + added).toFixed(2));
			break;
	}
	emit('change',value.value);
}

function constrainValue() {
	console.log(value.value)
	switch (checkValidValue(currentValue.value)) {
		case -1:
			value.value = props.min ?? 0;
			break;
		case 1:
			value.value = props.max ?? 0;
			break;

	}
	emit('change',value.value);
}

function checkValidValue(value: number) {
	if (props.min != undefined && value < props.min) {
		return -1;
	} else if (props.max != undefined && value > props.max) {
		return 1;
	} else {
		return 0;
	}
}
const emit = defineEmits<{
	(e: 'change', value: number | null): void
}>()
</script>

<template>
<div class="d-flex align-center" style="border-radius: 4px!important; border: 1px rgb(133,133,133) solid;">
	<VBtn
		variant="tonal"
		icon
		@click="quickChangeValue(-step)"
		style="border-radius: 0"
		@mousedown="continuousQuickChangeValue(-step)"
		@mouseup="endContinuousQuickChange"
		v-if="!hideControls"
	>
		<VIcon :icon="useArrows ? 'chevron-left' : 'minus'" size="default" class="clickableIcon"></VIcon>
	</VBtn>
	<VTextField
		:label
		v-model.number="value"
		type="number"
		:min="min"
		:max="max"
		:step="step"
		tile
		@change="constrainValue"
		:class="!center || 'centered-input'"
		class="flex-0-1-auto"
		:clearable="clearable"
		:suffix="suffix"
		hide-spin-buttons
		hide-details
		:center-affix="true"
	></VTextField>
	<VBtn
		variant="tonal"
		icon
		@click="quickChangeValue(step)"
		style="border-radius: 0"
		@mousedown="continuousQuickChangeValue(step)"
		@mouseup="endContinuousQuickChange"
		v-if="!hideControls"
	>
		<VIcon :icon="useArrows ? 'chevron-right' : 'plus'" size="default" class="clickableIcon"></VIcon>
	</VBtn>
</div>
</template>

<style scoped>
.centered-input:deep(input) {
	text-align: center;
	padding-left: 10px !important;
	margin-right: -15px !important;
	width: auto !important;
}
</style>