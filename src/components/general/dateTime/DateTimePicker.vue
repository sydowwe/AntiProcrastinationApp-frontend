<template>
<VRow>
	<VCol cols="11" sm="6">
		<MyDatePicker v-model="dateTime" :clearable="dateClearable" :showArrows="dateShowArrows" :max-date="maxDate" :min-date="minDate"></MyDatePicker>
	</VCol>
	<VCol cols="11" sm="6" class="px-0">
		<TimePicker :label="$t('dateTime.time')" v-model="time"></TimePicker>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import MyDatePicker from '@/components/general/dateTime/MyDatePicker.vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {TimeObject} from '@/classes/TimeUtils';

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
const dateTime = props.dateClearable ? ref<Date | null>(null) : ref<Date>(new Date());
const time = ref<TimeObject>(new TimeObject());

function setTime(hours: number, minutes:number) {
	dateTime.value?.setHours(hours, minutes, 0, 0);
}
function setDate(newDate: Date) {
	dateTime.value = newDate;
}
const getDateTime = computed(() => {
	if(!dateTime.value){
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