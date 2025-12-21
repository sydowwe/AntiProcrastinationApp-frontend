<template>
<VRow>
	<VCol cols="11" sm="5">
		<VDateInput :label v-model="dateTime" :clearable="dateClearable" :min="minDate" :max="maxDate"></VDateInput>
	</VCol>
	<VCol cols="11" sm="7" class="px-0">
		<TimePicker label="Čas" v-model="time"></TimePicker>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import {computed, ref} from 'vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {VDateInput} from 'vuetify/labs/components';
import {useMoment} from '@/scripts/momentHelper.ts';
import {TimePrecise} from '@/utils/TimePrecise.ts';

const {formatToDate} = useMoment()
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
const dateTime = props.dateClearable ? ref<Date | null>(null) : ref<Date>(new Date());
const time = ref<TimePrecise>(new TimePrecise());

function setTime(hours: number, minutes: number) {
	dateTime.value?.setHours(hours, minutes, 0, 0);
	time.value.hours = hours;
	time.value.minutes = minutes;
}

function setDate(newDate: Date) {
	dateTime.value = newDate;
}

const getDateTime = computed(() => {
	if (!dateTime.value) {
		return null;
	}
	let temp = new Date(dateTime.value);
	temp.setHours(time.value.hours, time.value.minutes, 0, 0);
	return temp;
});

defineExpose({
	setTime,
	setDate,
	getDateISO: dateTime.value?.toISOString(),
	getDate: dateTime.value?.getDate(),
	getDateTime
})
</script>