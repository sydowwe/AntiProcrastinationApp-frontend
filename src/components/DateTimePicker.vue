<template>
<VRow align="center">
	<VCol cols="11" sm="5">
		<MyDatePicker ref="datePicker" v-model:dateValue="dateTime" :clearable="dateClearable" :showArrows="dateShowArrows" :max-date="maxDate" :min-date="minDate"></MyDatePicker>
	</VCol>
	<VCol cols="11" sm="7">
		<TimePicker :label="i18n.t('dateTime.time')" @hoursChanged="handleHourChange" @minutesChanged="handleMinuteChange" class="ml-2"></TimePicker>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import MyDatePicker from '@/components/MyDatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import {MyDatePickerType} from '@/classes/types/RefTypeInterfaces';
import {importDefaults} from "@/compositions/Defaults";
const {i18n} = importDefaults();

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
});
const datePicker = ref<MyDatePickerType>({} as MyDatePickerType);
const dateTime = props.dateClearable ? ref<Date | null>(null) : ref<Date>(new Date());

const hours = ref(0);
const minutes = ref(0);

function handleHourChange(newHourValue: number): void {
	hours.value = newHourValue;
}
function handleMinuteChange(newMinuteValue: number): void {
	minutes.value = newMinuteValue;
}
function setTime(hours: number, minutes:number) {
	dateTime.value?.setHours(hours, minutes, 0, 0);
}
function setDate(newDate: Date) {
	dateTime.value = newDate;
}
const getDateTimeISO = computed(() => {
	if(!dateTime.value){
		return null;
	}
	let temp = new Date(dateTime.value);
	temp.setHours(hours.value, minutes.value, 0, 0);
	return temp.toISOString();
});
const getDateTime = computed(() => {
	if(!dateTime.value){
		return null;
	}
	let temp = new Date(dateTime.value);
	temp.setHours(hours.value, minutes.value, 0, 0);
	return temp;
});
defineExpose({
	setTime,
	setDate,
	getDateISO: datePicker.value.getDateISO,
	getDateTimeISO,
	getDate: datePicker.value.getDate,
	getDateTime
})
</script>