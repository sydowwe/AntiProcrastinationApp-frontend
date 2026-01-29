<template>
<VRow justify="center" align="center" noGutters>
	<VCol cols="12" sm="10" md="10" lg="10" class="mt-3 mt-md-0">
		<VCard elevation="3" class="pa-6">
			<VCardTitle class="text-h5 text-center pb-3">Pomodoro Timer</VCardTitle>
			<div v-if="timeInputVisible">
				<div class="d-flex justify-center ga-2 mb-3">
					<VBtn variant="tonal" prependIcon="sliders" color="secondaryOutline" @click="openPresets">{{ i18n.t('controls.presets') }}</VBtn>
					<VBtn variant="tonal" prependIcon="clock-rotate-left" @click="resetPickersToDefault">Defaults</VBtn>
				</div>
				<div class="d-flex justify-center ga-3">
					<SubtleCard color="primary-accent" borderOpacity="high" class="text-center pa-4">
						<VCardTitle class="px-0 pt-0 mb-1">{{ i18n.t('pomodoroTimer.focusTime') }}</VCardTitle>
						<TimePicker label="" variant="tonal" color="primaryOutline" v-model="focusInitialTime" viewMode="minute"></TimePicker>
					</SubtleCard>
					<SubtleCard color="primary-accent" borderOpacity="high" class="text-center pa-4">
						<VCardTitle class="px-0 pt-0 mb-1">{{ i18n.t('pomodoroTimer.shortRestTime') }}</VCardTitle>
						<TimePicker label="" variant="tonal" color="primaryOutline" v-model="shortRestInitialTime" viewMode="minute"></TimePicker>
					</SubtleCard>
					<SubtleCard color="primary-accent" borderOpacity="high" class="text-center pa-4">
						<VCardTitle class="px-0 pt-0 mb-1">{{ i18n.t('pomodoroTimer.longRestTime') }}</VCardTitle>
						<TimePicker label="" variant="tonal" color="primaryOutline" v-model="longRestInitialTime" viewMode="minute"></TimePicker>
					</SubtleCard>
				</div>
				<SubtleCard color="primary-accent" borderOpacity="high" class="mt-3 d-flex flex-column flex-md-row justify-center ga-2 ga-md-3 pa-2 mx-auto"
				            style="max-width: fit-content!important;">
					<div class="d-flex ga-3 align-center">
						<h4>{{ i18n.t('pomodoroTimer.numberOfFocusIntervalsInCycle') }}</h4>
						<VSelect class="flex-0-1" v-model="numberOfFocusPeriodsInCycle"
						         :items="[2,3,4,5,6]" hide-details :clearable="false"></VSelect>
					</div>
					<div class="d-flex ga-3 justify-end align-center">
						<h4>{{ i18n.t('pomodoroTimer.numberOfCycles') }}</h4>
						<VSelect class="flex-0-1" v-model="numberOfCycles"
						         :items="[1,2,3,4,5,6]" hide-details :clearable="false"></VSelect>
					</div>
				</SubtleCard>
			</div>
			<div v-else class="d-flex align-center">
				<TimeDisplayWithProgress :timeRemainingObject="timeDisplayObject.timeRemainingObject"
				                         :timeInitialObject="timeDisplayObject.timeInitialObject" :what-to-show="['minutes','seconds']"
				                         :color="timeDisplayObject.color" :title="timeDisplayObject.title"></TimeDisplayWithProgress>
			</div>
			<TimerControls class="mt-4 mb-5" :paused="paused" :intervalId="intervalId" @start="start" @pause="pause"
			               @stop="stop"></TimerControls>
			<hr/>
			<!-- Activity selection forms (before start) -->
			<VRow v-if="timeInputVisible" class="mt-1">
				<VCol cols="6">
					<div class="mb-1 d-flex ga-1 align-center">
						<VIcon icon="fas fa-bullseye" size="20"></VIcon>
						<h3 class="text-h6">
							{{ i18n.t('pomodoroTimer.focusActivity') }}
						</h3>
					</div>
					<ActivitySelectionForm ref="mainActivitySelectionForm" v-model:activityId="focusActivityId" :formDisabled="formDisabled"></ActivitySelectionForm>
				</VCol>
				<VCol cols="6">
					<div class="mb-1 d-flex ga-1 align-center">
						<VIcon icon="fas fa-mug-hot" size="20"></VIcon>
						<h3 class="text-h6">
							{{ i18n.t('pomodoroTimer.restActivity') }} ({{ i18n.t('general.optional') }})
						</h3>
					</div>
					<ActivitySelectionForm ref="restActivitySelectionForm" v-model:activityId="restActivityId" :formDisabled="formDisabled"
					                       isFilter></ActivitySelectionForm>
				</VCol>
			</VRow>
			<!-- Activity names display (after start) -->
			<div v-else class="d-flex justify-center ga-6 mt-3">
				<VChip color="primary" variant="tonal" size="large">
					<VIcon icon="fas fa-bullseye" start></VIcon>
					{{ mainActivitySelectionForm?.getSelectedActivityName }}
				</VChip>
				<VChip v-if="restActivitySelectionForm?.getSelectedActivityName" color="secondary" variant="tonal" size="large">
					<VIcon icon="fas fa-mug-hot" start></VIcon>
					{{ restActivitySelectionForm?.getSelectedActivityName }}
				</VChip>
			</div>
			<SaveActivityDialog ref="saveDialog" @saved="saveActivity()" @resetTime="resetTimer"></SaveActivityDialog>
			<PomodoroPresetsDialog ref="presetsDialog" @select="selectPreset"></PomodoroPresetsDialog>
		</VCard>
	</VCol>
</VRow>

</template>
<script setup lang="ts">
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import SaveActivityDialog from '@/components/dialogs/SaveActivityDialog.vue';
import {checkNotificationPermission, showNotification} from '@/scripts/notifications';
import {Time} from '@/utils/Time.ts';
import {computed, onUnmounted, ref} from 'vue';
import TimerControls from '@/components/addActivityToHistory/TimerControls.vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import {useI18n} from 'vue-i18n';
import TimeDisplayWithProgress from '@/components/general/dateTime/TimeDisplayWithProgress.vue';
import {TimePrecise} from '@/utils/TimePrecise.ts';
import PomodoroPresetsDialog from '@/components/addActivityToHistory/PomodoroPresetsDialog.vue';
import {useTimerNotifications} from '@/composables/useTimerNotifications.ts';
import SubtleCard from '@/components/general/feedback/SubtleCard.vue';

const i18n = useI18n();
const {triggerTimerEndNotification, stopAllNotifications, playNotificationSound, startTitleAnimation} = useTimerNotifications();

const mainActivitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const restActivitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>();
const presetsDialog = ref<InstanceType<typeof PomodoroPresetsDialog>>();

const focusInitialTime = ref(new Time(0, 25));
const shortRestInitialTime = ref(new Time(0, 5));
const longRestInitialTime = ref(new Time(0, 15));
const focusTimeElapsed = ref(0);
const restTimeElapsed = ref(0);

const numberOfCycles = ref(2);
const currentCycle = ref(1);
const numberOfFocusPeriodsInCycle = ref(4);
const currentFocusPeriod = ref(1);
const isFocus = ref(true);
const isEndOfCycle = computed(() => currentFocusPeriod.value === numberOfFocusPeriodsInCycle.value);

// Timestamp-based timer state
const endsAt = ref<number | null>(null);
const pausedRemaining = ref<number | null>(null);
const phaseStartedAt = ref<number | null>(null);
const notificationTimeoutId = ref<number | undefined>(undefined);
const now = ref(Date.now());

const timeRemaining = computed(() => {
	if (endsAt.value !== null) {
		return Math.max(0, Math.ceil((endsAt.value - now.value) / 1000));
	}
	if (pausedRemaining.value !== null) {
		return Math.max(0, Math.ceil(pausedRemaining.value / 1000));
	}
	return 0;
});

const currentTimerType = computed(() => {
	if (isFocus.value) {
		return 'focus';
	} else if (isEndOfCycle.value) {
		return 'longBreak';
	} else {
		return 'shortBreak';
	}
});

const timeDisplayObject = computed(() => {
	let timeInitialObject: Time;
	let color: string;
	let title: string;
	switch (currentTimerType.value) {
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
	const timeRemainingObject = TimePrecise.fromSeconds(timeRemaining.value);
	return {timeRemainingObject, timeInitialObject, color, title};
});

const startTimestamp = ref(new Date());
const timeInputVisible = ref(true);
const paused = ref(false);
const intervalId = ref<number | undefined>(undefined);
const formDisabled = ref(false);
const focusActivityId = ref<number | null>(null);
const restActivityId = ref<number | null>(null);

checkNotificationPermission();

async function start() {
	if (paused.value) {
		resume();
	} else {
		const validationResult = await mainActivitySelectionForm.value?.validate();
		if (validationResult && validationResult.length === 0) {
			formDisabled.value = true;
			startTimestamp.value = new Date();
			timeInputVisible.value = false;
			startPhase(focusInitialTime.value.getInSeconds);
		}
	}
}

function startPhase(durationSeconds: number) {
	const currentTime = Date.now();
	now.value = currentTime;
	phaseStartedAt.value = currentTime;
	endsAt.value = currentTime + durationSeconds * 1000;
	startUpdateInterval();
	schedulePhaseEndTimeout();
}

function pause() {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;

	// Save elapsed time for current phase
	if (phaseStartedAt.value !== null) {
		const elapsedMs = Date.now() - phaseStartedAt.value;
		if (isFocus.value) {
			focusTimeElapsed.value += Math.floor(elapsedMs / 1000);
		} else {
			restTimeElapsed.value += Math.floor(elapsedMs / 1000);
		}
	}

	if (endsAt.value !== null) {
		pausedRemaining.value = endsAt.value - Date.now();
		endsAt.value = null;
	}
	phaseStartedAt.value = null;
	paused.value = true;
}

function resume() {
	paused.value = false;
	const currentTime = Date.now();
	now.value = currentTime;
	phaseStartedAt.value = currentTime;

	if (pausedRemaining.value !== null) {
		endsAt.value = currentTime + pausedRemaining.value;
		pausedRemaining.value = null;
	}
	startUpdateInterval();
	schedulePhaseEndTimeout();
}

function startUpdateInterval() {
	intervalId.value = setInterval(() => {
		now.value = Date.now();
	}, 250);
}

function schedulePhaseEndTimeout() {
	if (endsAt.value === null) return;
	const delay = endsAt.value - Date.now();
	if (delay > 0) {
		notificationTimeoutId.value = setTimeout(() => {
			onPhaseEnd();
		}, delay);
	}
}

function onPhaseEnd() {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;

	// Save elapsed time for completed phase
	if (phaseStartedAt.value !== null) {
		const elapsedMs = Date.now() - phaseStartedAt.value;
		if (isFocus.value) {
			focusTimeElapsed.value += Math.floor(elapsedMs / 1000);
		} else {
			restTimeElapsed.value += Math.floor(elapsedMs / 1000);
		}
		phaseStartedAt.value = null;
	}

	// Show notification for phase end with context
	const activityName = mainActivitySelectionForm.value?.getSelectedActivityName as string;
	const cycleInfo = `Cycle ${currentCycle.value}/${numberOfCycles.value}`;
	const focusInfo = `Focus ${currentFocusPeriod.value}/${numberOfFocusPeriodsInCycle.value}`;

	playNotificationSound();
	switch (currentTimerType.value) {
		case 'focus':
			startTitleAnimation(`Focus ended! | ${cycleInfo}`, `Time for a break`);
			showNotification('Focus period ended', `${activityName} - ${focusInfo} | ${cycleInfo}. Time for a break!`);
			break;
		case 'shortBreak':
			startTitleAnimation(`Break ended! | ${cycleInfo}`, `Time to focus`);
			showNotification('Short break ended', `${cycleInfo} - Time to focus on ${activityName}!`);
			break;
		case 'longBreak':
			startTitleAnimation(`Long break ended!`, `Starting cycle ${currentCycle.value + 1}`);
			showNotification('Long break ended', `Cycle ${currentCycle.value} complete. Time for cycle ${currentCycle.value + 1}!`);
			break;
	}

	// Transition to next phase
	isFocus.value = !isFocus.value;

	if (currentCycle.value === numberOfCycles.value && isEndOfCycle.value && !isFocus.value) {
		stop(true);
	} else {
		let nextDuration: number;
		if (isFocus.value) {
			nextDuration = focusInitialTime.value.getInSeconds;
			if (isEndOfCycle.value) {
				currentFocusPeriod.value = 1;
			} else {
				currentFocusPeriod.value++;
			}
		} else {
			if (isEndOfCycle.value) {
				nextDuration = longRestInitialTime.value.getInSeconds;
				currentCycle.value++;
			} else {
				nextDuration = shortRestInitialTime.value.getInSeconds;
			}
		}
		startPhase(nextDuration);
	}
}

function stop(automatic: boolean) {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;

	// Save any remaining elapsed time
	if (phaseStartedAt.value !== null) {
		const elapsedMs = Date.now() - phaseStartedAt.value;
		if (isFocus.value) {
			focusTimeElapsed.value += Math.floor(elapsedMs / 1000);
		} else {
			restTimeElapsed.value += Math.floor(elapsedMs / 1000);
		}
		phaseStartedAt.value = null;
	}

	const timeSpent = Time.fromSeconds(focusTimeElapsed.value);
	const restTime = Time.fromSeconds(restTimeElapsed.value);
	const activityName = mainActivitySelectionForm.value?.getSelectedActivityName as string;
	const restActivityName = restActivitySelectionForm.value?.getSelectedActivityName as string;
	saveDialog.value?.open(activityName, timeSpent);

	if (automatic) {
		const completedCycles = currentCycle.value;
		triggerTimerEndNotification(
			`🍅 Pomodoro complete! | ${completedCycles} cycle${completedCycles > 1 ? 's' : ''}`,
			`${activityName} - ${timeSpent.getNice}`
		);
		showNotification(
			'Pomodoro complete!',
			`${completedCycles} cycle${completedCycles > 1 ? 's' : ''} done! Focused on ${activityName} for ${timeSpent.getNice}${restActivityName ? `, rested with ${restActivityName}` : ''} for ${restTime.getNice}`
		);
	}
}

function resetTimer() {
	paused.value = false;
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;
	formDisabled.value = false;
	timeInputVisible.value = true;
	focusTimeElapsed.value = 0;
	restTimeElapsed.value = 0;
	numberOfCycles.value = 2;
	currentCycle.value = 1;
	numberOfFocusPeriodsInCycle.value = 4;
	currentFocusPeriod.value = 1;
	isFocus.value = true;
	endsAt.value = null;
	pausedRemaining.value = null;
	phaseStartedAt.value = null;
	stopAllNotifications();
}

function resetPickersToDefault() {
	focusInitialTime.value = (new Time(0, 25));
	shortRestInitialTime.value = (new Time(0, 5));
	longRestInitialTime.value = (new Time(0, 10));
}

function saveActivity() {
	mainActivitySelectionForm.value?.saveActivityToHistory(startTimestamp.value, Time.fromSeconds(focusTimeElapsed.value));
	// Only save rest activity if one was selected and there was rest time
	if (restActivitySelectionForm.value?.getSelectedActivityName && restTimeElapsed.value > 0) {
		restActivitySelectionForm.value.saveActivityToHistory(startTimestamp.value, Time.fromSeconds(restTimeElapsed.value));
	}
}

function openPresets() {
	presetsDialog.value?.open();
}

function selectPreset(preset: {
	focusTime: Time;
	shortRestTime: Time;
	longRestTime: Time;
	numberOfFocusPeriodsInCycle: number;
	numberOfCycles: number;
	focusActivityId: number | null;
	restActivityId: number | null;
}) {
	focusInitialTime.value = preset.focusTime;
	shortRestInitialTime.value = preset.shortRestTime;
	longRestInitialTime.value = preset.longRestTime;
	numberOfFocusPeriodsInCycle.value = preset.numberOfFocusPeriodsInCycle;
	numberOfCycles.value = preset.numberOfCycles;
	if (preset.focusActivityId) {
		focusActivityId.value = preset.focusActivityId;
	}
	if (preset.restActivityId) {
		restActivityId.value = preset.restActivityId;
	}
}

onUnmounted(() => {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
});
</script>
<style scoped>
.borderGrey {
	border: 1px solid darkgray !important;
}
</style>