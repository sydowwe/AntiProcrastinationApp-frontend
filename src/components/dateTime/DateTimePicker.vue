<template>
<VRow align="center" no-gutters>
	<VCol cols="11" sm="5" class="px-0 pr-2">
		<MyDatePicker ref="datePicker" v-model="dateTime" :clearable="dateClearable" :showArrows="dateShowArrows" :max-date="maxDate" :min-date="minDate"></MyDatePicker>
	</VCol>
	<VCol cols="11" sm="7" class="px-0">
		<TimePicker :label="i18n.t('dateTime.time')" @hoursChanged="handleHourChange" @minutesChanged="handleMinuteChange" ></TimePicker>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import MyDatePicker from '@/components/dateTime/MyDatePicker.vue';
import TimePicker from '@/components/dateTime/TimePicker.vue';
import {MyDatePickerType} from '@/classes/types/RefTypeInterfaces';
import {useI18n} from 'vue-i18n';
const i18n = useI18n();

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