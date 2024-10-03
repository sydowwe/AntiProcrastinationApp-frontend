<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<v-card elevation="3" class="pa-6">
			<v-card-title class="text-h5 text-center pb-0">Pomodoro Timer</v-card-title>
			<v-card-subtitle class="text-h6 text-center mb-5">Stay focused, stay productive!</v-card-subtitle>
			<div v-if="timeInputVisible">
				<div class="d-flex justify-center ga-2 mb-3">
					<VBtn color="warning" style="color: white!important;" @click="resetPickersToDefault">{{ i18n.t('controls.resetToDefaults') }}</VBtn>
					<VBtn color="primary" @click="openPresets">{{ i18n.t('controls.presets') }}</VBtn>
					<VBtn color="blue-grey-lighten-1" @click="openSettings">{{ i18n.t('controls.settings') }}</VBtn>
				</div>
				<div class="d-flex justify-center ga-3">
					<VCard variant="tonal" class="pa-4 borderGrey">
						<VCardTitle class="text-center pt-0 mb-1">{{ i18n.t('pomodoroTimer.focusTime') }}</VCardTitle>
						<TimePicker v-model="focusInitialTime" :whatToShow="['minutes','seconds']"></TimePicker>
					</VCard>
					<VCard variant="tonal" class="pa-4 borderGrey">
						<VCardTitle class="text-center pt-0 mb-1">{{ i18n.t('pomodoroTimer.shortRestTime') }}</VCardTitle>
						<TimePicker v-model="shortRestInitialTime" :whatToShow="['minutes','seconds']"></TimePicker>
					</VCard>
					<VCard variant="tonal" class="pa-4 borderGrey">
						<VCardTitle class="text-center pt-0 mb-1">{{ i18n.t('pomodoroTimer.longRestTime') }}</VCardTitle>
						<TimePicker v-model="longRestInitialTime" :whatToShow="['minutes','seconds']"></TimePicker>
					</VCard>
				</div>
				<VCard variant="tonal" class="mt-3 d-flex flex-column flex-md-row justify-center ga-2 ga-md-3 pa-2 mx-auto borderGrey"
				       style="max-width: fit-content!important;">
					<div class="d-flex ga-3">
						<VLabel>{{ i18n.t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}</VLabel>
						<VSelect class="flex-0-1" v-model="numberOfFocusPeriodsInCycle"
						         :items="[2,3,4,5,6]" hide-details :clearable="false"></VSelect>
					</div>
					<div class="d-flex ga-3 justify-end align-center">
						<VLabel>{{ i18n.t('pomodoroTimer.numberOfCycles') }}</VLabel>
						<VSelect class="flex-0-1" v-model="numberOfCycles"
						         :items="[1,2,3,4,5,6]" hide-details :clearable="false"></VSelect>
					</div>
				</VCard>
			</div>
			<div v-else class="d-flex align-center">
				<TimeDisplayWithProgress :timeRemainingObject="timeDisplayObject.timeRemainingObject"
				                         :timeInitialObject="timeDisplayObject.timeInitialObject"
				                         :color="timeDisplayObject.color" :title="timeDisplayObject.title"></TimeDisplayWithProgress>
			</div>
			<TimerControls class="mt-4 mb-5" :paused="paused" :intervalId="intervalId" @start="start" @pause="pause"
			               @stop="stop"></TimerControls>
			<hr/>
<!--			<VRow>-->
<!--				<VCol cols="6">-->
					<ActivitySelectionForm ref="mainActivitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
<!--				</VCol>-->
<!--				<VCol cols="6">-->
<!--					<ActivitySelectionForm ref="restActivitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>-->
<!--				</VCol>-->
<!--			</VRow>-->
			<SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTimer"></SaveActivityDialog>
		</v-card>
	</VCol>
</VRow>

</template>
<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import SaveActivityDialog from '@/components/dialogs/SaveActivityDialog.vue';
import {showNotification, checkNotificationPermission} from '@/scripts/notifications';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {
	ActivityDialogType,
	ActivitySelectionFormType,
} from '@/classes/types/RefTypeInterfaces';
import {computed, ref} from 'vue';
import TimerControls from '@/components/TimerControls.vue';
import TimePicker from '@/components/dateTime/TimePicker.vue';
import {useI18n} from 'vue-i18n';
import TimeDisplayWithProgress from '@/components/dateTime/TimeDisplayWithProgress.vue';

const i18n = useI18n();

const mainActivitySelectionForm = ref<ActivitySelectionFormType>({});
const restActivitySelectionForm = ref<ActivitySelectionFormType>({});
const saveDialog = ref<ActivityDialogType>({});

// const focusInitialTime = ref(new TimeLengthObject(0, 25, 0));
// const shortRestInitialTime = ref(new TimeLengthObject(0, 5, 0));
// const longRestInitialTime = ref(new TimeLengthObject(0, 15, 0));
const focusInitialTime = ref(new TimeLengthObject(0, 0, 10));
const shortRestInitialTime = ref(new TimeLengthObject(0, 0, 5));
const longRestInitialTime = ref(new TimeLengthObject(0, 0, 8));
const focusTimeElapsed = ref(0);
const restTimeElapsed = ref(0);

const numberOfCycles = ref(2);
const currentCycle = ref(1);
const numberOfFocusPeriodsInCycle = ref(4);
const currentFocusPeriod = ref(1);
const isFocus = ref(true);
const isEndOfCycle = computed(() => currentFocusPeriod.value === numberOfFocusPeriodsInCycle.value);

const currentTimerType = computed(()=>{
	if (isFocus.value) {
		return 'focus';
	} else if (isEndOfCycle.value) {
		return 'longBreak';
	} else {
		return 'shortBreak';
	}
})
const timeDisplayObject = computed(() => {
	let timeInitialObject: TimeLengthObject;
	let color: string;
	let title: string;
	switch (currentTimerType.value){
		case "focus":
			timeInitialObject = focusInitialTime.value;
			color = 'blue';
			title = i18n.t('pomodoroTimer.focus');
			break;
		case "shortBreak":
			timeInitialObject = shortRestInitialTime.value;
			color = 'yellow-lighten-2';
			title = i18n.t('pomodoroTimer.shortRest');
			break;
		case "longBreak":
			timeInitialObject = longRestInitialTime.value;
			color = 'deep-purple-lighten-1';
			title = i18n.t('pomodoroTimer.longRest');
			break;
	}
	const timeRemainingObject = TimeLengthObject.fromSeconds(timeRemaining.value);
	return {timeRemainingObject, timeInitialObject, color, title};
});
const timeRemaining = ref(0);
const startTimestamp = ref(new Date());

const timeInputVisible = ref(true);
const paused = ref(false);
const intervalId = ref<number | null>(null);
const formDisabled = ref(false);

checkNotificationPermission();

function start() {
	if (paused.value) {
		resume();
	} else if (mainActivitySelectionForm.value.validate()) {
		formDisabled.value = true;
		startTimestamp.value = new Date();
		timeInputVisible.value = false;
		timeRemaining.value = focusInitialTime.value.getInSeconds;
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
			switch (currentTimerType.value){
				case 'focus':
					showNotification('Focus period ended', `You focused for ${focusInitialTime.value.getNice} time for short break`);
					break;
				case 'shortBreak':
					showNotification('Short break ended', `You rested for ${shortRestInitialTime.value.getNice} time to focus`);
					break;
				case 'longBreak':
					showNotification('Long break ended', `You rested for ${longRestInitialTime.value.getNice} time to focus`);
					break;
			}
			isFocus.value = !isFocus.value;
			if (currentCycle.value === numberOfCycles.value && isEndOfCycle.value && !isFocus.value) {
				stop(true);
			} else {
				if (isFocus.value) {
					timeRemaining.value = focusInitialTime.value.getInSeconds;
					if (isEndOfCycle.value) {
						currentFocusPeriod.value = 1;
					} else {
						currentFocusPeriod.value++;
					}
				} else {
					if (isEndOfCycle.value) {
						timeRemaining.value = longRestInitialTime.value.getInSeconds;
						currentCycle.value++;
					} else {
						timeRemaining.value = shortRestInitialTime.value.getInSeconds;
					}
				}
			}
		} else {
			timeRemaining.value--;
			if (isFocus.value) {
				focusTimeElapsed.value++;
			} else {
				restTimeElapsed.value++;
			}
		}
	}, 1000);
}

function stop(automatic: boolean) {
	clearInterval(intervalId.value);
	const timeSpentNice = TimeLengthObject.fromSeconds(focusTimeElapsed.value).getNice;
	const restNice = TimeLengthObject.fromSeconds(restTimeElapsed.value).getNice;
	let activityName = mainActivitySelectionForm.value.getSelectedActivityName as string;
	saveDialog.value.open(activityName, timeSpentNice);
	if (automatic) {
		showNotification('Timer ended', `Your focused on ${activityName} for ${timeSpentNice} and rested for ${restNice}`);
	}
}

function resetTimer() {
	paused.value = false;
	intervalId.value = null;
	formDisabled.value = false;
	timeInputVisible.value = true;
	focusTimeElapsed.value = 0;
	restTimeElapsed.value = 0;
	numberOfCycles.value = 2;
	currentCycle.value = 1;
	numberOfFocusPeriodsInCycle.value = 4;
	currentFocusPeriod.value = 1;
	isFocus.value = true;
}

function resetPickersToDefault() {
	focusInitialTime.value = (new TimeLengthObject(0, 25, 0));
	shortRestInitialTime.value = (new TimeLengthObject(0, 5, 0));
	longRestInitialTime.value = (new TimeLengthObject(0, 10, 0));
}

function saveActivity() {
	mainActivitySelectionForm.value.saveActivityToHistory(startTimestamp.value, TimeLengthObject.fromSeconds(focusTimeElapsed.value));
	restActivitySelectionForm.value.saveActivityToHistory(startTimestamp.value, TimeLengthObject.fromSeconds(restTimeElapsed.value));
}
</script>
<style scoped>
.borderGrey {
	border: 1px solid darkgray !important;
}
</style>