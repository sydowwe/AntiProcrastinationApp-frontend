<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="11" md="10" lg="7" class="mt-lg-5 mt-md-3 d-flex flex-column ga-6">
		<TimePicker class="w-md-50 w-lg-50 mx-auto" v-if="timeInputVisible" v-model="initialTime"></TimePicker>
		<TimeDisplayWithProgress v-else :timeInitialObject="initialTime" :timeRemainingObject="timeRemainingObject"></TimeDisplayWithProgress>

		<TimerControls :intervalId="intervalId" :paused="paused" @start="start" @pause="pause" @stop="stop"></TimerControls>
		<hr/>
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
	</VCol>
</VRow>
<SaveActivityDialog ref="saveDialog" @saved="saveActivity" @resetTime="resetTimer"></SaveActivityDialog>
</template>
<script setup lang="ts">
import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue';
import SaveActivityDialog from '../../components/dialogs/SaveActivityDialog.vue';
import {checkNotificationPermission, showNotification} from '@/scripts/notifications';
import {Time} from '@/utils/Time.ts';
import type {ActivityDialogType, ActivitySelectionFormType} from '@/types/RefTypeInterfaces';
import {computed, ref} from 'vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import TimeDisplayWithProgress from '@/components/general/dateTime/TimeDisplayWithProgress.vue';
import TimerControls from '@/components/addActivityToHistory/TimerControls.vue';
import {TimePrecise} from '@/utils/TimePrecise.ts';

const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);


const timeInputVisible = ref(true);
const initialTime = ref(new Time());
const timeRemaining = ref(0);
const timeRemainingObject = computed(() => {
	return TimePrecise.fromSeconds(timeRemaining.value)
});
const paused = ref(false);
const intervalId = ref<number | undefined>(undefined);
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
	let activityName = activitySelectionForm.value.getSelectedActivityName as string;
	if (automatic) {
		showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timePassed().getNice}`);
	}
	if (timePassed().getInMinutes > 0) {
		saveDialog.value.open(activityName, timePassed());
	} else {
		resetTimer();
	}
}

function resetTimer() {
	paused.value = false;
	intervalId.value = undefined;
	formDisabled.value = false;
	timeInputVisible.value = true;
	timeRemaining.value = 0;
}

function resetToDefault() {
	initialTime.value = new Time();
}

function saveActivity() {
	activitySelectionForm.value.saveActivityToHistory(startTimestamp.value, timePassed());
}

function timePassed() {
	return timeRemaining.value == 0 ? initialTime.value : initialTime.value.subtract(timeRemainingObject.value.toTimeLength);
}
</script>