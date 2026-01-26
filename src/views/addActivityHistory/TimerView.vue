<template>
<VRow justify="center" noGutters>
	<VCol cols="12" sm="11" md="10" lg="7" xl="6" class="mt-lg-5 mt-md-3 d-flex flex-column ga-6">
		<TimePicker class="w-md-50 w-xl-25 mx-auto" v-if="timeInputVisible" v-model="initialTime" viewMode="minute" variant="tonal"
		            color="secondaryOutline"></TimePicker>
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
import {computed, onUnmounted, ref} from 'vue';
import TimePicker from '@/components/general/dateTime/TimePicker.vue';
import TimeDisplayWithProgress from '@/components/general/dateTime/TimeDisplayWithProgress.vue';
import TimerControls from '@/components/addActivityToHistory/TimerControls.vue';
import {TimePrecise} from '@/utils/TimePrecise.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useTimerNotifications} from '@/composables/useTimerNotifications.ts';

const {showErrorSnackbar} = useSnackbar();
const {triggerTimerEndNotification, stopAllNotifications} = useTimerNotifications();

const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>();

const timeInputVisible = ref(true);
const initialTime = ref(new Time());
const paused = ref(false);
const intervalId = ref<number | undefined>(undefined);
const startTimestamp = ref(new Date());
const formDisabled = ref(false);

// Timestamp-based timer state
const endsAt = ref<number | null>(null);
const pausedRemaining = ref<number | null>(null);
const notificationTimeoutId = ref<number | undefined>(undefined);
const now = ref(Date.now()); // Reactive tick for forcing re-computation

const timeRemaining = computed(() => {
	if (endsAt.value === null) {
		return 0;
	}
	return Math.max(0, Math.ceil((endsAt.value - now.value) / 1000));
});

const timeRemainingObject = computed(() => {
	return TimePrecise.fromSeconds(timeRemaining.value);
});

checkNotificationPermission();

async function start() {
	if (paused.value) {
		resume();
	} else {
		if (initialTime.value.getInSeconds === 0) {
			showErrorSnackbar('Please set a timer duration');
			return;
		}
		const validationResult = await activitySelectionForm.value?.validate();
		if (validationResult && validationResult.length === 0) {
			formDisabled.value = true;
			startTimestamp.value = new Date();
			timeInputVisible.value = false;
			const durationMs = initialTime.value.getInSeconds * 1000;
			const currentTime = Date.now();
			now.value = currentTime;
			endsAt.value = currentTime + durationMs;
			startUpdateInterval();
			scheduleNotificationTimeout();
		}
	}
}

function pause() {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;

	if (endsAt.value !== null) {
		pausedRemaining.value = endsAt.value - Date.now();
		endsAt.value = null;
	}
	paused.value = true;
}

function resume() {
	paused.value = false;
	if (pausedRemaining.value !== null) {
		endsAt.value = Date.now() + pausedRemaining.value;
		pausedRemaining.value = null;
	}
	startUpdateInterval();
	scheduleNotificationTimeout();
}

function startUpdateInterval() {
	intervalId.value = setInterval(() => {
		now.value = Date.now(); // Update reactive tick to trigger re-computation
		if (timeRemaining.value === 0) {
			stop(true);
		}
	}, 250);
}

function scheduleNotificationTimeout() {
	if (endsAt.value === null) return;
	const delay = endsAt.value - Date.now();
	if (delay > 0) {
		notificationTimeoutId.value = setTimeout(() => {
			if (endsAt.value !== null && timeRemaining.value === 0) {
				stop(true);
			}
		}, delay);
	}
}

function stop(automatic: boolean) {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;

	const activityName = activitySelectionForm.value!.getSelectedActivityName as string;
	if (automatic) {
		triggerTimerEndNotification('Timer ended!', activityName);
		showNotification('Timer ended', `Your timer for ${activityName} ended it ran for ${timePassed().getNice}`);
	}
	if (timePassed().getInMinutes > 0) {
		saveDialog.value!.open(activityName, timePassed());
	} else {
		resetTimer();
	}
}

function resetTimer() {
	paused.value = false;
	intervalId.value = undefined;
	notificationTimeoutId.value = undefined;
	formDisabled.value = false;
	timeInputVisible.value = true;
	endsAt.value = null;
	pausedRemaining.value = null;
	stopAllNotifications();
}

function resetToDefault() {
	initialTime.value = new Time();
}

function saveActivity() {
	activitySelectionForm.value!.saveActivityToHistory(startTimestamp.value, timePassed());
}

function timePassed() {
	return timeRemaining.value === 0 ? initialTime.value : initialTime.value.subtract(timeRemainingObject.value.toTimeLength);
}

onUnmounted(() => {
	clearInterval(intervalId.value);
	clearTimeout(notificationTimeoutId.value);
});
</script>