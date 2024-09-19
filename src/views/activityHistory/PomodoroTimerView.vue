<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-lg-5 mt-md-3">
		<v-card elevation="3" class="pa-6">
			<v-card-title class="text-h5 text-center pb-0">Pomodoro Timer</v-card-title>
			<v-card-subtitle class="text-h6 text-center mb-5">Stay focused, stay productive!</v-card-subtitle>
			<div v-if="timeInputVisible">
				<VCard variant="tonal" class="mb-3 d-flex justify-center ga-3 pa-2 mx-auto borderGrey" style="max-width: fit-content!important;">
					<VLabel>{{i18n.t('pomodoroTimer.numberOfFocusIntervalsInCycle')}}</VLabel>
					<VSelect class="flex-0-1" v-model="numberOfFocusPeriodsInCycle"
					         :items="[2,3,4,5,6]" hide-details :clearable="false"></VSelect>
					<VLabel>{{i18n.t('pomodoroTimer.numberOfCycles')}}</VLabel>
					<VSelect class="flex-0-1" v-model="numberOfCycles"
					         :items="[1,2,3,4,5,6]" hide-details :clearable="false"></VSelect>
				</VCard>
				<div class="d-flex justify-center ga-2">
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
				<div>

				</div>
			</div>
			<div v-else class="d-flex">
				<TimeDisplayWithProgress :timeRemainingObject="timeDisplayObject.timeRemainingObject"
				                         :timeInitialObject="timeDisplayObject.timeInitialObject"
				                         :color="timeDisplayObject.color"></TimeDisplayWithProgress>
			</div>
			<TimerControls :paused="paused" :intervalId="intervalId" @start="start" @pause="pause" @stop="stop"></TimerControls>
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
import {showNotification, checkNotificationPermission} from '@/scripts/notifications';
import {TimeLengthObject} from '@/classes/TimeUtils';
import {
	ActivityDialogType,
	ActivitySelectionFormType,
} from '@/classes/types/RefTypeInterfaces';
import {getTimeNiceFromTimeObject} from '@/compositions/DateTimeFunctions';
import {computed, ref} from 'vue';
import TimerControls from '@/components/TimerControls.vue';
import TimePicker from '@/components/TimePicker.vue';
import {useI18n} from 'vue-i18n';
import TimeDisplayWithProgress from '@/components/TimeDisplayWithProgress.vue';

const i18n = useI18n();

const mainActivitySelectionForm = ref<ActivitySelectionFormType>({});
const restActivitySelectionForm = ref<ActivitySelectionFormType>({});
const saveDialog = ref<ActivityDialogType>({});

// const focusInitialTime = ref(new TimeLengthObject(0, 25, 0));
// const shortRestInitialTime = ref(new TimeLengthObject(0, 5, 0));
// const longRestInitialTime = ref(new TimeLengthObject(0, 15, 0));
const focusInitialTime = ref(new TimeLengthObject(0, 0, 15));
const shortRestInitialTime = ref(new TimeLengthObject(0, 0, 5));
const longRestInitialTime = ref(new TimeLengthObject(0, 0, 10));
type TtimerType = 'focus' | 'shortBreak' | 'longBreak';

const numberOfCycles = ref(2);
const currentCycle = ref(1);
const numberOfFocusPeriodsInCycle = ref(4);
const currentFocusPeriod = ref(1);
const isRestNext = ref(true);
const isLongRest = computed(() => currentFocusPeriod.value === numberOfFocusPeriodsInCycle.value)

const timeDisplayObject = computed(() => {
	let timeRemainingObject = TimeLengthObject.fromSeconds(timeRemaining.value);
	let timeInitialObject: TimeLengthObject;
	let color: string;
	if (isRestNext.value) {
		timeInitialObject = focusInitialTime.value;
		color = 'blue';
	} else if (isLongRest.value) {
		timeInitialObject = longRestInitialTime.value;
		color = 'yellow-lighten-2';
	} else {
		timeInitialObject = shortRestInitialTime.value;
		color = 'deep-purple-lighten-1';
	}
	return {timeRemainingObject, timeInitialObject, color};
});
const timeInputVisible = ref(true);
const timeRemaining = ref(0);

const paused = ref(false);
const intervalId = ref<number | null>(null);
const startTimestamp = ref(new Date());
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
			if (currentCycle.value === numberOfCycles.value && isLongRest.value) {
				stop(true);
			} else {
				if (!isRestNext.value) {
					timeRemaining.value = focusInitialTime.value.getInSeconds;
					currentFocusPeriod.value++;
				} else {
					if (isLongRest.value) {
						timeRemaining.value = longRestInitialTime.value.getInSeconds;
						currentCycle.value++;
						currentFocusPeriod.value = 1;
					} else {
						timeRemaining.value = shortRestInitialTime.value.getInSeconds;
					}
				}
				isRestNext.value = !isRestNext.value;
			}
		} else {
			timeRemaining.value--;
		}
	}, 1000);
}

function stop(automatic: boolean) {
	clearInterval(intervalId.value);
	const timeSpentNice = getTimeNiceFromTimeObject(timePassed());
	let activityName = activitySelectionForm.value.getSelectedActivityName as string;
	saveDialog.value.open(activityName, timeSpentNice);
	if (automatic) {
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
	return timeRemaining.value == 0 ? currentTimeInitialObject.value : currentTimeInitialObject.value.subtract(timeRemainingObject.value);
}
</script>
<style scoped>
.borderGrey {
	border: 1px solid darkgray !important;
}
</style>