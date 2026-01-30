<template>
<div class="d-flex">
	<VDateInput class="date-time-datePicker" :label="label ?? $t('dateTime.date')" v-model="date" :clearable="dateClearable" persistent-clear :min="minDate"
	            :max="maxDate" hide-details minWidth="150px" maxWidth="150px" prependInnerIcon="far fa-calendar"></VDateInput>
	<TimePickerTextField class="date-time-timePicker" :label="label ? '' : $t('dateTime.time')" v-model="time" minWidth="100px"
	                     maxWidth="100px" hideDetails></TimePickerTextField>
</div>
</template>
<script setup lang="ts">
import {nextTick, ref, watch} from 'vue';
import {VDateInput} from 'vuetify/labs/components';
import {Time} from '@/utils/Time.ts';
import TimePickerTextField from '@/components/general/dateTime/TimePickerTextField.vue';

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
<style scoped>
.date-time-timePicker:deep(.v-field) {
	border-bottom-left-radius: 0 !important;
	border-top-left-radius: 0 !important;
}

.date-time-datePicker:deep(.v-field) {
	border-bottom-right-radius: 0 !important;
	border-top-right-radius: 0 !important;
}
</style>