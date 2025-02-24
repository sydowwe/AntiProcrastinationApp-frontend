<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3 d-flex flex-column">
		<TimePicker v-if="timeInputVisible" v-model="initialTime"></TimePicker>
		<TimeDisplayWithProgress v-else :timeInitialObject="initialTime" :timeRemainingObject="timeRemainingObject"></TimeDisplayWithProgress>
		<TimerControls :intervalId="intervalId" :paused="paused" @start="start" @pause="pause" @stop="stop"
		               @reset="resetToDefault"></TimerControls>
		<hr/>
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTimer()"></SaveActivityDialog>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue';
import SaveActivityDialog from '../../components/dialogs/SaveActivityDialog.vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {showNotification, checkNotificationPermission} from '@/scripts/notifications';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {ActivityDialogType,	ActivitySelectionFormType} from '@/classes/types/RefTypeInterfaces';
import {computed, ref} from 'vue';
import TimerControls from '@/components/TimerControls.vue';
import TimeDisplayWithProgress from '@/components/general/dateTime/TimeDisplayWithProgress.vue';
import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue';

const activitySelectionForm = ref<ActivitySelectionFormType>({});
const saveDialog = ref<ActivityDialogType>({});


const timeInputVisible = ref(true);
const initialTime = ref(new TimeLengthObject());
const timeRemaining = ref(0);
const timeRemainingObject = computed(() => {
	return TimeLengthObject.fromSeconds(timeRemaining.value)
});
const paused = ref(false);
const intervalId = ref<number | null>(null);
const startTimestamp = ref(new Date());
const formDisabled = ref(false);

checkNotificationPermission();

function start() {
	if (paused.value) {
		resume();
	} else if (activitySelectionForm.value.validate()) {
		formDisabled.value = true;
		startTimestamp.value = new Date();
		timeInputVisible.value = false;
		timeRemaining.value = initialTime.value.getInSeconds;
		resume();
	}
}

function pause() {
	clearInterval(intervalId.value);
	paused.value = true;
}

function resume() {
	paused.value = false;
	intervalId.value = setInterval(() => {
		if (timeRemaining.value == 0) {
			stop(true);
		} else {
			console.log(timeRemainingObject.value);
			timeRemaining.value--;
		}
	}, 1000);
}

function stop(automatic: boolean) {
	clearInterval(intervalId.value);
	const timeSpentNice = timePassed().getNice;
	let activityName = activitySelectionForm.value.getSelectedActivityName as string;
	saveDialog.value.open(activityName, timeSpentNice);
	if(automatic){
		showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timeSpentNice}`);
	}
}

function resetTimer() {
	paused.value = false;
	intervalId.value = null;
	formDisabled.value = false;
	timeInputVisible.value = true;
	timeRemaining.value = 0;
}

function resetToDefault() {
	initialTime.value = new TimeLengthObject();
}

function saveActivity() {
	activitySelectionForm.value.saveActivityToHistory(startTimestamp.value, timePassed());
}

function timePassed() {
	return timeRemaining.value == 0 ? initialTime.value : initialTime.value.subtract(timeRemainingObject.value);
}
</script>