<template>
<VRow justify="center">
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<VRow v-if="timeInputVisible" justify="center">
			<VCol cols="12" lg="6" md="8" sm="10">
				<DateTimePicker v-model="alarmDateTime" :dateClearable="false"></DateTimePicker>
			</VCol>
		</VRow>
		<VRow justify="center" class="mt-4 mb-7">
			<VBtn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== undefined && !paused">Set</VBtn>
			<VBtn size="large" color="error" @click="stop" :disabled="intervalId === undefined">Cancel</VBtn>
		</VRow>
		<hr/>
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import ActivitySelectionForm from '../ActivitySelectionForm.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';
import SaveActivityDialog from '../dialogs/SaveActivityDialog.vue';
import {Time} from '@/utils/Time.ts';
import {ref, watch} from 'vue';

const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>();

const alarmDateTime = ref<Date | null>(new Date());
const alarmTime = ref(new Time());
const timeInitial = ref(new Time());
const timeRemaining = ref(0);
const paused = ref(false);
const startTimestamp = ref(new Date());
const intervalId = ref(undefined as number | undefined);
const timeInputVisible = ref(true);
const formDisabled = ref(false);

watch(alarmDateTime, (newDateTime) => {
	if (newDateTime) {
		timeInitial.value = new Time(newDateTime.getHours(), newDateTime.getMinutes());
	}
});

async function start() {
	if (activitySelectionForm.value?.validate()) {
		formDisabled.value = true;
		startTimestamp.value = new Date();
		timeInputVisible.value = false;
		timeRemaining.value = timeInitial.value.getInSeconds;
		resume();
	}
	const currentTime = new Date();
	const hoursDiff = alarmTime.value.hours - currentTime.getHours();
	let minutesDiff = alarmTime.value.minutes - currentTime.getMinutes();
	minutesDiff += currentTime.getSeconds() > 29 ? 1 : 0;

	const totalMilliseconds = hoursDiff * 60 * 60 * 1000 + minutesDiff * 60 * 1000;

	if (totalMilliseconds > 0) {
		setTimeout(() => {
			triggerAlarm();
		}, totalMilliseconds);
	} else {
		console.log('Invalid alarm time. Please set a future time.');
	}
}

function triggerAlarm() {
	console.log('Alarm! Time to wake up!');
}

function pause() {
	clearInterval(intervalId.value);
	paused.value = true;
}

function resume() {
	paused.value = false;
	alarmTime.value = Time.fromSeconds(timeRemaining.value);
	intervalId.value = setInterval(() => {
		if (timeRemaining.value == 0) {
			stop();
		} else {
			timeRemaining.value--;
			alarmTime.value = Time.fromSeconds(timeRemaining.value);
		}
	}, 1000);
}

function stop() {
	clearInterval(intervalId.value);
	saveDialog.value?.open(activitySelectionForm.value?.getSelectedActivityName as string, timePassed());
}

function resetTime() {
	alarmTime.value = new Time();
	paused.value = false;
	intervalId.value = undefined;
	formDisabled.value = false;
	timeInputVisible.value = true;
	timeRemaining.value = 0;
	startTimestamp.value = new Date();
}

function saveActivity() {
	activitySelectionForm.value?.saveActivityToHistory(startTimestamp.value, timePassed());
}

function timePassed() {
	return timeRemaining.value == 0 ? timeInitial.value : timeInitial.value.subtract(alarmTime.value);
}
</script>
