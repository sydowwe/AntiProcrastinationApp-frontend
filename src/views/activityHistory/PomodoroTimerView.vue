<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">

		<v-card elevation="3" class="pa-6">
			<v-card-title class="text-h5 text-center">Pomodoro Timer</v-card-title>
			<v-card-subtitle class="text-center mb-4">Stay focused, stay productive!</v-card-subtitle>
			<TimePicker v-if="timeInputVisible" :timeObject="time" :whatToShow="['minutes','seconds']"></TimePicker>
			<VProgressCircular v-else
			                   :model-value="mainActivityProgress"
			                   :rotate="270"
			                   size="400"
			                   width="30"
			                   color="primary"
			                   class="mx-auto mb-4"
			>
				<TimeDisplay :timeObject="time"></TimeDisplay>
			</VProgressCircular>
			<TimerControls paused="paused" intervalId="intervalId" @start="start" @pause="pause" @stop="stop"></TimerControls>
			<hr/>
			<VRow>
				<VCol cols="6">
					<ActivitySelectionForm ref="mainActivitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
				</VCol>
				<VCol cols="6">
					<ActivitySelectionForm ref="restActivitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
				</VCol>
			</VRow>
			<SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
		</v-card>
	</VCol>
</VRow>

</template>
<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import SaveActivityDialog from '@/components/dialogs/SaveActivityDialog.vue';
import TimeDisplay from '@/components/TimeDisplay.vue';
import {showNotification, checkNotificationPermission} from '@/scripts/notifications';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {
	ActivityDialogType,
	ActivitySelectionFormType,
} from '@/classes/types/RefTypeInterfaces';
import {getTimeNiceFromTimeObject, getSecondsFromTimeObject, getTimeObjectFromSeconds} from '@/compositions/DateTimeFunctions';
import {computed, ref} from 'vue';
import TimerControls from '@/components/TimerControls.vue';
import TimePicker from '@/components/TimePicker.vue';

const mainActivitySelectionForm = ref<ActivitySelectionFormType>({});
const restActivitySelectionForm = ref<ActivitySelectionFormType>({});
const saveDialog = ref<ActivityDialogType>({});

const timeInputVisible = ref(true);
const timeRemaining = ref(0);
const initialTime = ref(new TimeLengthObject());
const paused = ref(false);
const intervalId = ref(undefined as number | undefined);
const startTimestamp = ref(new Date());
const formDisabled = ref(false);


const mainActivityProgress = computed(()=>{
	console.log(timeRemaining.value / time.value.getInSeconds * 100)
	return timeRemaining.value / time.value.getInSeconds * 100;
})

checkNotificationPermission();

function start() {
	if (paused.value) {
		resume();
	} else if (mainActivitySelectionForm.value.validate()) {
		formDisabled.value = true;
		startTimestamp.value = new Date();
		timeInputVisible.value = false;
		timeRemaining.value = getSecondsFromTimeObject(timeLength.value);
		console.log(timeRemaining.value);
		resume();
	}
}

function pause() {
	clearInterval(intervalId.value);
	paused.value = true;
}

function resume() {
	console.log(timeRemaining.value);
	paused.value = false;
	time.value = getTimeObjectFromSeconds(timeRemaining.value);
	intervalId.value = setInterval(() => {
		if (timeRemaining.value == 0) {
			stop();
		} else {
			timeRemaining.value--;
			time.value = getTimeObjectFromSeconds(timeRemaining.value);
		}
	}, 1000);
}

function stop() {
	clearInterval(intervalId.value);
	const timeSpentNice = getTimeNiceFromTimeObject(timePassed());
	let activityName = mainActivitySelectionForm.value.getSelectedActivityName as string;
	showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timeSpentNice}`);
	saveDialog.value.open(activityName, timeSpentNice);
}

function resetTime() {
	time.value = new TimeLengthObject();
	paused.value = false;
	intervalId.value = undefined;
	formDisabled.value = false;
	timeInputVisible.value = true;
	timeRemaining.value = 0;
}

function saveActivity() {
	mainActivitySelectionForm.value.saveActivityToHistory(startTimestamp.value, timePassed());
}

function timePassed() {
	return timeRemaining.value == 0 ? timeLength.value : timeLength.value.subtract(time.value);
}
</script>