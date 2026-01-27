<template>
<VRow justify="center" noGutters class="my-auto">
	<VCol cols="12" sm="11" md="10" lg="7" xl="6" class="d-flex flex-column">
		<VRow justify="center">
			<VCol cols="12" sm="11" md="10" lg="8" xl="6">
				<TimeDisplay :timeObject="time"></TimeDisplay>
			</VCol>
		</VRow>
		<TimerControls class="mt-6 mb-7" :intervalId :paused="paused" @start="start" @pause="pause" @stop="stop"></TimerControls>
		<hr class="mb-4"/>
		<ActivitySelectionForm ref="activitySelectionForm" :formDisabled="formDisabled"></ActivitySelectionForm>
		<SaveActivityDialog ref="saveDialog" @saved="saveActivity" @resetTime="resetTime"></SaveActivityDialog>
	</VCol>
</VRow>
</template>
<script setup lang="ts">
import ActivitySelectionForm from '../../components/ActivitySelectionForm.vue';
import TimeDisplay from '@/components/general/dateTime/TimeDisplay.vue';
import SaveActivityDialog from '../../components/dialogs/SaveActivityDialog.vue';
import {Time} from '@/utils/Time.ts';
import {ref} from 'vue';
import TimerControls from '@/components/addActivityToHistory/TimerControls.vue';
import {TimePrecise} from '@/utils/TimePrecise.ts';

const activitySelectionForm = ref<InstanceType<typeof ActivitySelectionForm>>();
const saveDialog = ref<InstanceType<typeof SaveActivityDialog>>();

const time = ref(new TimePrecise());
const paused = ref(false);
const intervalId = ref<number | undefined>(undefined);
const startTimestamp = ref(new Date());
const formDisabled = ref(false);

// Timestamp-based elapsed time tracking
const startedAt = ref<number | null>(null);
const pausedElapsed = ref(0);

function updateTimeDisplay() {
	let totalMs: number;
	if (startedAt.value !== null) {
		totalMs = Date.now() - startedAt.value + pausedElapsed.value;
	} else {
		totalMs = pausedElapsed.value;
	}

	const totalSeconds = Math.floor(totalMs / 1000);

	time.value.hours = Math.floor(totalSeconds / 3600);
	time.value.minutes = Math.floor((totalSeconds % 3600) / 60);
	time.value.seconds = totalSeconds % 60;
}

async function start() {
	const validationResult = await activitySelectionForm.value?.validate();
	if (validationResult && validationResult.length === 0) {
		formDisabled.value = true;
		paused.value = false;
		startTimestamp.value = new Date();
		startedAt.value = Date.now();
		intervalId.value = setInterval(updateTimeDisplay, 1000);
	}
}

function pause() {
	clearInterval(intervalId.value);
	if (startedAt.value !== null) {
		pausedElapsed.value += Date.now() - startedAt.value;
		startedAt.value = null;
	}
	paused.value = true;
	formDisabled.value = false;
}

function stop() {
	clearInterval(intervalId.value);
	if (startedAt.value !== null) {
		pausedElapsed.value += Date.now() - startedAt.value;
		startedAt.value = null;
	}
	updateTimeDisplay();
	showSaveDialog();
}

function resetTime() {
	time.value = new TimePrecise();
	paused.value = false;
	intervalId.value = undefined;
	startedAt.value = null;
	pausedElapsed.value = 0;
	formDisabled.value = false;
}

function showSaveDialog() {
	let activityName = activitySelectionForm.value!.getSelectedActivityName;
	if (activityName !== null) {
		saveDialog.value!.open(activityName, time.value.toTimeLength);
	}
}

function saveActivity(length: Time) {
	activitySelectionForm.value!.saveActivityToHistory(startTimestamp.value, length);
}
</script>
