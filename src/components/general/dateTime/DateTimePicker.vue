<template>
<VRow :style="{minWidth: (dateClearable ? '333px' : '275px')}">
	<VCol cols="11" sm="7">
		<VDateInput :label v-model="date" :clearable="dateClearable" persistent-clear :min="minDate" :max="maxDate"></VDateInput>
	</VCol>
	<VCol cols="11" sm="5" class="px-0">
		<TimePicker label="Čas" v-model="time"></TimePicker>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import {nextTick, ref, watch} from 'vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {VDateInput} from 'vuetify/labs/components';
import {Time} from '@/utils/Time.ts';

const props = defineProps({
	dateClearable: {
		type: Boolean,
		default: true,
	},
	dateShowArrows: {
		type: Boolean,
		default: true,
	},
	maxDate: {
		type: Date,
		default: null,
	},
	minDate: {
		type: Date,
		default: null,
	},
	timeShowArrows: {
		type: Boolean,
		default: true,
	},
	label: String,
});

const model = defineModel<Date | null>();

// Initialize internal state from model
const date = ref<Date | null>(model.value ? new Date(model.value) : null);
const time = ref<Time>(new Time());

let isUpdatingFromModel = false;

// Update model when date changes
watch(date, () => {
	if (isUpdatingFromModel) return;
	updateModel();
});

// Update model when time changes
watch(time, () => {
	if (isUpdatingFromModel) return;
	updateModel();
}, {deep: true});

function updateModel() {
	if (!date.value) {
		model.value = null;
		return;
	}

	const combined = new Date(date.value);
	combined.setHours(time.value.hours, time.value.minutes, 0, 0);
	model.value = combined;
}

// Update internal state when model changes from parent
watch(model, (newModel) => {
	isUpdatingFromModel = true;

	if (!newModel) {
		date.value = null;
		time.value = new Time();
	} else {
		date.value = new Date(newModel);
		time.value = new Time(newModel.getHours(), newModel.getMinutes());
	}

	nextTick(() => {
		isUpdatingFromModel = false;
	});
});
</script>