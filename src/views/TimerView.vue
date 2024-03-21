<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<VRow v-if="timeInputVisible" justify="center" noGutters>
			<VCol cols="12" lg="6" md="8" sm="10">
				<TimeLengthPicker v-model="timeLength"></TimeLengthPicker>
			</VCol>
		</VRow>
		<TimeDisplay v-else :timeObject="time"></TimeDisplay>
		<VRow justify="center" class="mt-4 mb-7" noGutters>
			<VBtn size="large" class="mr-4" color="success" @click="start" :disabled="intervalId !== undefined && !paused">Start</VBtn>
			<VBtn size="large" class="mr-4" color="primary" @click="pause" :disabled="intervalId === undefined || paused">Pause</VBtn>
			<VBtn size="large" color="error" @click="stop" :disabled="intervalId === undefined">Stop</VBtn>
		</VRow>
		<hr/>
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTime()"></SaveActivityDialog>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import ActivitySelectionForm from '../components/ActivitySelectionForm.vue';
import TimeLengthPicker from '../components/TimeLengthPicker.vue';
import SaveActivityDialog from '../components/./dialogs/SaveActivityDialog.vue';
import TimeDisplay from '../components/TimeDisplay.vue';
import {showNotification, checkNotificationPermission} from '@/scripts/notifications';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {
	ActivityDialogType,
	ActivitySelectionFormType,
} from '@/classes/types/RefTypeInterfaces';
import {getTimeNiceFromTimeObject, getSecondsFromTimeObject, getTimeObjectFromSeconds} from '@/compositions/DateTimeFunctions';
import {ref} from 'vue';

const activitySelectionForm = ref<ActivitySelectionFormType>({} as ActivitySelectionFormType);
const saveDialog = ref<ActivityDialogType>({} as ActivityDialogType);

const timeInputVisible = ref(true);
const timeRemaining = ref(0);
const time = ref(new TimeLengthObject());
const paused = ref(false);
const intervalId = ref(undefined as number | undefined);
const startTimestamp = ref(new Date());
const formDisabled = ref(false);
const timeLength = ref(new TimeLengthObject());

checkNotificationPermission();

function start() {
	if (paused) {
		resume();
	} else if (activitySelectionForm.value.validate()) {
		formDisabled.value = true;
		startTimestamp.value = new Date();
		timeInputVisible.value = false;
		timeRemaining.value = getSecondsFromTimeObject(timeLength.value);
		resume();
	}
}

function pause() {
	clearInterval(intervalId.value);
	paused.value = true;
}

function resume() {
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
	let activityName = activitySelectionForm.value.getSelectedActivityName as string;
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
	activitySelectionForm.value.saveActivityToHistory(startTimestamp.value, timePassed());
}
function timePassed(){
	return timeRemaining.value == 0 ? timeLength.value : timeLength.value.subtract(time.value);
}
</script>